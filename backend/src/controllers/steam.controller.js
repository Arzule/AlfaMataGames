// Conectar Steam e importar la biblioteca (A4-5).
//
// Vincular (mismo patrón que el login social, ver oauth.controller.js):
//  1. POST /steam/link/start { redirectUri, codeChallenge } → URL de Steam OpenID con un state
//     firmado (10 min) que guarda el usuario, el retorno validado y el challenge PKCE.
//  2. Steam vuelve a GET /steam/callback; el backend verifica la firma con Steam y redirige al
//     deep link con un código de un solo uso (2 min).
//  3. La app confirma con POST /steam/link/confirm { code, codeVerifier } y se guarda la cuenta.
//
// Sincronizar (por lotes, ninguna petición larga):
//  POST /steam/sync pide los juegos a Steam y prepara el trabajo; POST /steam/sync/next procesa
//  el siguiente lote (correspondencia con IGDB y reglas) y devuelve el progreso.
//
// Reglas por tiempo jugado: < 120 min → Pendiente; ≥ 120 min → Jugando; > 3000 min → además
// favorito. Lo que el usuario cambió a mano (fuente 'user') no se toca, un favorito quitado no
// se vuelve a marcar y un juego que el usuario borró de su biblioteca no se vuelve a agregar.
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const steam = require('../services/steam.service');
const igdb = require('../services/igdb.service');
const oneTimeCodes = require('../utils/oneTimeCodes');
const { isAllowedRedirect, withQuery, sendFailurePage } = require('./oauth.controller');
const { createLogger } = require('../utils/logger');

const log = createLogger('steam');

const STATE_AUDIENCE = 'steam-state';
const STATE_TTL = '10m';
const BATCH_SIZE = 100;
const JOB_TTL_MS = 30 * 60 * 1000;
// Un juego no encontrado en IGDB se vuelve a buscar pasados 30 días.
const RETRY_NOT_FOUND_MS = 30 * 24 * 60 * 60 * 1000;
const PLAYING_MINUTES = 120;
const FAVORITE_MINUTES = 3000;
const NOT_FOUND_LIST_MAX = 300;

const MESSAGES = {
  STEAM_NOT_CONFIGURED: 'La conexión con Steam no está disponible.',
  NOT_LINKED: 'Primero conecta tu cuenta de Steam.',
  ALREADY_LINKED: 'Ya tienes una cuenta de Steam conectada. Desconéctala para cambiarla.',
  STEAM_TAKEN: 'Esa cuenta de Steam ya está conectada a otro usuario.',
  PRIVATE_PROFILE:
    'Tus detalles de juego en Steam no son públicos. En Steam: Perfil → Editar perfil → ' +
    'Privacidad → Detalles de juego: Público. Luego vuelve a sincronizar.',
  STEAM_UNAVAILABLE: 'No se pudo contactar con Steam. Inténtalo más tarde.',
  NO_SYNC: 'No hay una sincronización en curso. Vuelve a empezarla.',
  SYNC_BUSY: 'La sincronización ya está procesando un lote.',
  CODE_EXPIRED: 'La conexión con Steam venció. Inténtalo de nuevo.',
  INVALID_VERIFIER: 'codeVerifier inválido.',
};

// Trabajos de sincronización en memoria, uno por usuario.
const jobs = new Map();

function fail(res, status, code) {
  return res.status(status).json({ message: MESSAGES[code] || 'Error de Steam.', code });
}

function callbackUrl() {
  const base = (process.env.OAUTH_CALLBACK_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return { realm: base, url: `${base}/steam/callback` };
}

async function findAccount(userId) {
  const [rows] = await pool.query(
    'SELECT steam_id, persona_name, last_sync_at FROM steam_accounts WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

function progressOf(job) {
  if (!job) return null;
  return {
    total: job.items.length,
    processed: job.index,
    added: job.added,
    updated: job.updated,
    notFoundCount: job.notFound.length,
    notFound: job.done ? job.notFound.slice(0, NOT_FOUND_LIST_MAX) : undefined,
    done: job.done,
  };
}

function currentJob(userId) {
  const job = jobs.get(userId);
  if (job && job.expiresAt <= Date.now()) {
    jobs.delete(userId);
    return null;
  }
  return job || null;
}

// GET /steam — estado de la conexión y de la sincronización en curso.
async function status(req, res, next) {
  try {
    if (!steam.isConfigured()) return res.json({ available: false, linked: false });
    const account = await findAccount(req.userId);
    return res.json({
      available: true,
      linked: Boolean(account),
      steamId: account?.steam_id ?? null,
      personaName: account?.persona_name ?? null,
      lastSyncAt: account?.last_sync_at ?? null,
      sync: progressOf(currentJob(req.userId)),
    });
  } catch (err) {
    return next(err);
  }
}

// POST /steam/link/start — body: { redirectUri, codeChallenge }
async function start(req, res, next) {
  try {
    if (!steam.isConfigured()) return fail(res, 503, 'STEAM_NOT_CONFIGURED');
    const { redirectUri, codeChallenge } = req.body || {};
    if (!isAllowedRedirect(redirectUri)) {
      return res.status(400).json({ message: 'Dirección de retorno no permitida.' });
    }
    if (!oneTimeCodes.isValidChallenge(codeChallenge)) {
      return res.status(400).json({ message: 'codeChallenge inválido.' });
    }
    if (await findAccount(req.userId)) return fail(res, 409, 'ALREADY_LINKED');

    const state = jwt.sign({ u: req.userId, r: redirectUri, c: codeChallenge }, process.env.JWT_SECRET, {
      expiresIn: STATE_TTL,
      audience: STATE_AUDIENCE,
    });
    const { realm, url } = callbackUrl();
    return res.json({ url: steam.loginUrl(`${url}?state=${encodeURIComponent(state)}`, realm) });
  } catch (err) {
    return next(err);
  }
}

// GET /steam/callback — Steam vuelve aquí con los parámetros openid.*.
async function callback(req, res) {
  let state;
  try {
    state = jwt.verify(String(req.query.state || ''), process.env.JWT_SECRET, {
      audience: STATE_AUDIENCE,
    });
  } catch (err) {
    return sendFailurePage(res);
  }
  if (!isAllowedRedirect(state.r)) return sendFailurePage(res);
  const back = (params) => res.redirect(302, withQuery(state.r, params));

  try {
    const steamId = await steam.verifyLogin(req.query, `${callbackUrl().url}?`);
    const code = oneTimeCodes.create({ kind: 'steam', userId: state.u, steamId, challenge: state.c });
    return back({ code });
  } catch (err) {
    if (err.code === 'CANCELLED' || err.code === 'STEAM_INVALID' || err.code === 'STEAM_UNAVAILABLE') {
      log.info(`Conexión con Steam rechazada: ${err.code}`);
      return back({ error: err.code });
    }
    log.error('Error en el callback de Steam', { error: err.message });
    return back({ error: 'SERVER_ERROR' });
  }
}

// POST /steam/link/confirm — body: { code, codeVerifier }. Guarda la cuenta vinculada.
async function confirm(req, res, next) {
  try {
    const { code, codeVerifier } = req.body || {};
    const { payload, error } = oneTimeCodes.consume(code, codeVerifier);
    if (error === 'INVALID_VERIFIER') return fail(res, 400, error);
    // Código vencido, de otro tipo o emitido para otro usuario: igual que vencido.
    if (error || payload.kind !== 'steam' || payload.userId !== req.userId) {
      return fail(res, 400, 'CODE_EXPIRED');
    }

    const [taken] = await pool.query('SELECT user_id FROM steam_accounts WHERE steam_id = ?', [
      payload.steamId,
    ]);
    if (taken.length && taken[0].user_id !== req.userId) return fail(res, 409, 'STEAM_TAKEN');
    const account = await findAccount(req.userId);
    if (account && account.steam_id !== payload.steamId) return fail(res, 409, 'ALREADY_LINKED');

    if (!account) {
      const personaName = await steam.getPersonaName(payload.steamId);
      try {
        await pool.query(
          'INSERT INTO steam_accounts (user_id, steam_id, persona_name) VALUES (?, ?, ?)',
          [req.userId, payload.steamId, personaName]
        );
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'STEAM_TAKEN');
        throw err;
      }
    }
    return status(req, res, next);
  } catch (err) {
    return next(err);
  }
}

// DELETE /steam — desconecta la cuenta. Los juegos ya importados quedan en la biblioteca.
async function unlink(req, res, next) {
  try {
    jobs.delete(req.userId);
    await pool.query('DELETE FROM user_steam_games WHERE user_id = ?', [req.userId]);
    const [result] = await pool.query('DELETE FROM steam_accounts WHERE user_id = ?', [req.userId]);
    if (!result.affectedRows) return fail(res, 404, 'NOT_LINKED');
    return status(req, res, next);
  } catch (err) {
    return next(err);
  }
}

function sendSteamError(res, err, next) {
  if (err.code && MESSAGES[err.code]) return fail(res, err.status || 502, err.code);
  // Errores de IGDB (igdb.service): ya traen status y un mensaje apto para el usuario.
  if (err.status && err.code) return res.status(err.status).json({ message: err.message, code: err.code });
  return next(err);
}

// POST /steam/sync — pide los juegos a Steam y prepara el trabajo por lotes.
async function syncStart(req, res, next) {
  try {
    if (!steam.isConfigured()) return fail(res, 503, 'STEAM_NOT_CONFIGURED');
    const account = await findAccount(req.userId);
    if (!account) return fail(res, 404, 'NOT_LINKED');
    const current = currentJob(req.userId);
    if (current?.busy) return fail(res, 409, 'SYNC_BUSY');

    const games = await steam.getOwnedGames(account.steam_id);
    const job = {
      items: games,
      index: 0,
      added: 0,
      updated: 0,
      notFound: [],
      handled: new Set(),
      busy: false,
      done: games.length === 0,
      expiresAt: Date.now() + JOB_TTL_MS,
    };
    jobs.set(req.userId, job);
    if (job.done) await markSynced(req.userId);
    log.info('Sincronización de Steam iniciada', { userId: req.userId, games: games.length });
    return res.json({ sync: progressOf(job) });
  } catch (err) {
    return sendSteamError(res, err, next);
  }
}

// POST /steam/sync/next — procesa el siguiente lote.
async function syncNext(req, res, next) {
  const job = currentJob(req.userId);
  if (!job) return fail(res, 404, 'NO_SYNC');
  if (job.done) return res.json({ sync: progressOf(job) });
  if (job.busy) return fail(res, 409, 'SYNC_BUSY');

  job.busy = true;
  try {
    const batch = job.items.slice(job.index, job.index + BATCH_SIZE);
    const maps = await resolveMatches(batch);
    await applyBatch(req.userId, batch, maps, job);
    job.index += batch.length;
    job.expiresAt = Date.now() + JOB_TTL_MS;
    if (job.index >= job.items.length) {
      job.done = true;
      await markSynced(req.userId);
      log.info('Sincronización de Steam terminada', {
        userId: req.userId,
        added: job.added,
        updated: job.updated,
        notFound: job.notFound.length,
      });
    }
    return res.json({ sync: progressOf(job) });
  } catch (err) {
    // El lote no avanzó: la app puede reintentar el mismo lote.
    return sendSteamError(res, err, next);
  } finally {
    job.busy = false;
  }
}

function markSynced(userId) {
  return pool.query('UPDATE steam_accounts SET last_sync_at = CURRENT_TIMESTAMP WHERE user_id = ?', [userId]);
}

// Nombre de Steam comparable con IGDB: sin ™, ® ni ©.
const cleanName = (name) => name.replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim();

// Correspondencia Steam → IGDB del lote, con la caché steam_igdb_map.
// Devuelve Map(appid → fila de la caché).
async function resolveMatches(batch) {
  const appids = batch.map((item) => item.appid);
  const [rows] = await pool.query('SELECT * FROM steam_igdb_map WHERE appid IN (?)', [appids]);
  const maps = new Map(rows.map((row) => [row.appid, row]));

  const retryBefore = Date.now() - RETRY_NOT_FOUND_MS;
  const pending = batch.filter((item) => {
    const row = maps.get(item.appid);
    return !row || (row.igdb_game_id === null && new Date(row.checked_at).getTime() < retryBefore);
  });
  if (!pending.length) return maps;

  // 1) external_games (appid de Steam). 2) Si falta, nombre exacto.
  const byExternal = await igdb.findSteamGames(pending.map((item) => item.appid));
  const rest = pending.filter((item) => !byExternal.has(item.appid));
  const byName = rest.length ? await igdb.findGamesByName(rest.map((item) => cleanName(item.name))) : new Map();

  const found = new Map();
  for (const item of pending) {
    if (byExternal.has(item.appid)) found.set(item.appid, { id: byExternal.get(item.appid), by: 'external' });
    else if (byName.has(cleanName(item.name))) found.set(item.appid, { id: byName.get(cleanName(item.name)), by: 'name' });
  }
  const details = new Map(
    (await igdb.getGamesByIds([...found.values()].map((match) => match.id))).map((game) => [game.id, game])
  );

  const values = pending.map((item) => {
    const match = found.get(item.appid);
    const game = match ? details.get(match.id) : null;
    const row = {
      appid: item.appid,
      steam_name: item.name,
      igdb_game_id: game ? game.id : null,
      matched_by: game ? match.by : null,
      game_name: game ? game.name.slice(0, 255) : null,
      game_image: game ? game.image : null,
      game_rating: game ? game.rating : null,
      checked_at: new Date(),
    };
    maps.set(item.appid, row);
    return [row.appid, row.steam_name, row.igdb_game_id, row.matched_by, row.game_name, row.game_image, row.game_rating];
  });
  await pool.query(
    `INSERT INTO steam_igdb_map
       (appid, steam_name, igdb_game_id, matched_by, game_name, game_image, game_rating)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       steam_name = VALUES(steam_name), igdb_game_id = VALUES(igdb_game_id),
       matched_by = VALUES(matched_by), game_name = VALUES(game_name),
       game_image = VALUES(game_image), game_rating = VALUES(game_rating),
       checked_at = CURRENT_TIMESTAMP`,
    [values]
  );
  return maps;
}

// Aplica las reglas a la biblioteca del usuario y registra los juegos procesados.
async function applyBatch(userId, batch, maps, job) {
  const appids = batch.map((item) => item.appid);
  const [trackedRows] = await pool.query(
    'SELECT appid, igdb_game_id FROM user_steam_games WHERE user_id = ? AND appid IN (?)',
    [userId, appids]
  );
  const tracked = new Map(trackedRows.map((row) => [row.appid, row]));

  const gameIds = [...new Set(batch.map((item) => maps.get(item.appid)?.igdb_game_id).filter(Boolean))];
  const library = new Map();
  if (gameIds.length) {
    const [rows] = await pool.query(
      `SELECT game_id, status, status_source, is_favorite, favorite_source
         FROM user_games WHERE user_id = ? AND game_id IN (?)`,
      [userId, gameIds]
    );
    rows.forEach((row) => library.set(row.game_id, row));
  }

  const trackValues = [];
  for (const item of batch) {
    const match = maps.get(item.appid);
    const gameId = match?.igdb_game_id ?? null;
    trackValues.push([userId, item.appid, gameId, item.playtime]);
    if (!gameId) {
      job.notFound.push(item.name);
      continue;
    }
    // Dos appids de Steam pueden ser el mismo juego de IGDB: se aplica una sola vez.
    if (job.handled.has(gameId)) continue;
    job.handled.add(gameId);

    const isNew = !tracked.get(item.appid)?.igdb_game_id;
    const outcome = await applyGame(userId, gameId, match, item.playtime, isNew, library.get(gameId));
    if (outcome === 'added') job.added += 1;
    else if (outcome === 'updated') job.updated += 1;
  }

  await pool.query(
    `INSERT INTO user_steam_games (user_id, appid, igdb_game_id, playtime_minutes) VALUES ?
     ON DUPLICATE KEY UPDATE igdb_game_id = VALUES(igdb_game_id),
                             playtime_minutes = VALUES(playtime_minutes)`,
    [trackValues]
  );
}

// Reglas de un juego. Devuelve 'added', 'updated' o 'unchanged'.
async function applyGame(userId, gameId, match, playtime, isNew, row) {
  const desiredStatus = playtime >= PLAYING_MINUTES ? 'Jugando' : 'Pendiente';
  const desiredFavorite = playtime > FAVORITE_MINUTES;

  if (!row) {
    // Ya se había importado y no está: el usuario lo borró de su biblioteca.
    if (!isNew) return 'unchanged';
    await pool.query(
      `INSERT INTO user_games
         (user_id, game_id, game_name, game_image, game_rating, is_favorite, favorite_source,
          status, status_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'steam')
       ON DUPLICATE KEY UPDATE game_id = game_id`,
      [
        userId,
        gameId,
        match.game_name || match.steam_name,
        match.game_image ?? null,
        match.game_rating ?? null,
        desiredFavorite ? 1 : 0,
        desiredFavorite ? 'steam' : null,
        desiredStatus,
      ]
    );
    return 'added';
  }

  const changes = {};
  // El estado sigue a Steam si lo puso Steam o si nadie lo puso.
  const statusFollowsSteam =
    row.status_source === 'steam' || (row.status_source === null && row.status === null);
  if (statusFollowsSteam && (row.status !== desiredStatus || row.status_source !== 'steam')) {
    changes.status = desiredStatus;
    changes.status_source = 'steam';
  }
  // Solo se marca el favorito; nunca se quita ni se vuelve a marcar uno que el usuario quitó.
  if (row.favorite_source !== 'user' && desiredFavorite && !row.is_favorite) {
    changes.is_favorite = 1;
    changes.favorite_source = 'steam';
  }
  if (!Object.keys(changes).length) return 'unchanged';

  await pool.query('UPDATE user_games SET ? WHERE user_id = ? AND game_id = ?', [changes, userId, gameId]);
  return 'updated';
}

module.exports = { status, start, callback, confirm, unlink, syncStart, syncNext };
