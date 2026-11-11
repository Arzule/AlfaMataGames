// Cliente de IGDB (Twitch) en el backend: las credenciales no salen del servidor.
// Devuelve los juegos ya normalizados al formato que consume la app.
const { createLogger } = require('../utils/logger');

const log = createLogger('igdb');

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const API_URL = 'https://api.igdb.com/v4';
const TIMEOUT_MS = 8000;
// Se renueva el token un poco antes de que venza.
const TOKEN_MARGIN_MS = 5 * 60 * 1000;
const IMAGE_URL = 'https://images.igdb.com/igdb/image/upload';

// Juegos principales, remakes, remasters y ediciones ampliadas (sin DLC, mods ni bundles).
const GAME_TYPES = '(0,8,9,10)';
// Catálogo sin búsqueda: juegos con portada y suficientes valoraciones, los más votados primero.
const POPULAR_WHERE = `cover != null & game_type = ${GAME_TYPES} & total_rating_count > 20`;
// Juego al azar: entre los N más votados.
const RANDOM_POOL = 1000;

const LIST_FIELDS = 'name,cover.image_id,total_rating,platforms.abbreviation';
const DETAIL_FIELDS = [
  'name',
  'summary',
  'first_release_date',
  'total_rating',
  'cover.image_id',
  'artworks.image_id',
  'screenshots.image_id',
  'platforms.name',
  'involved_companies.developer',
  'involved_companies.company.name',
].join(',');

// Error con status HTTP para que el controlador responda sin adivinar.
function serviceError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

const isConfigured = () =>
  Boolean(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET);

const unavailable = () =>
  serviceError(502, 'No se pudo contactar con el catálogo de juegos.', 'CATALOG_UNAVAILABLE');

// --- Token de aplicación (client credentials), en memoria y compartido ---
let token = null; // { value, expiresAt }
let tokenRequest = null;

async function requestToken() {
  const params = new URLSearchParams({
    client_id: process.env.IGDB_CLIENT_ID,
    client_secret: process.env.IGDB_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  let response;
  try {
    response = await fetch(`${TOKEN_URL}?${params}`, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    log.warn('Token de Twitch -> sin respuesta', { error: err.name });
    throw unavailable();
  }
  if (!response.ok) {
    log.warn(`Token de Twitch -> ${response.status}`);
    throw unavailable();
  }
  const data = await response.json();
  token = {
    value: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in) * 1000 - TOKEN_MARGIN_MS,
  };
  log.info('Token de IGDB renovado');
  return token.value;
}

function getToken() {
  if (token && Date.now() < token.expiresAt) return Promise.resolve(token.value);
  if (!tokenRequest) {
    tokenRequest = requestToken().finally(() => {
      tokenRequest = null;
    });
  }
  return tokenRequest;
}

// POST a un endpoint de IGDB con una consulta Apicalypse. Si el token fue revocado (401),
// se pide uno nuevo y se reintenta una vez.
async function igdbQuery(endpoint, body, retried = false) {
  if (!isConfigured()) {
    throw serviceError(503, 'El servicio de juegos no está configurado.', 'CATALOG_NOT_CONFIGURED');
  }
  const accessToken = await getToken();

  let response;
  try {
    response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    log.warn(`POST /${endpoint} -> sin respuesta`, { error: err.name });
    throw unavailable();
  }

  if (response.status === 401 && !retried) {
    token = null;
    return igdbQuery(endpoint, body, true);
  }
  if (!response.ok) {
    log.warn(`POST /${endpoint} -> ${response.status}`);
    throw unavailable();
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// --- Normalización ---
const imageUrl = (imageId, size) => (imageId ? `${IMAGE_URL}/t_${size}/${imageId}.jpg` : null);

// total_rating de IGDB va de 0 a 100; la app muestra de 0 a 5.
const toFive = (rating) =>
  typeof rating === 'number' ? Math.round((rating / 20) * 10) / 10 : null;

function toListItem(game) {
  return {
    id: game.id,
    name: game.name ?? '',
    image: imageUrl(game.cover?.image_id, 'cover_big'),
    platform: game.platforms?.[0]?.abbreviation ?? null,
    rating: toFive(game.total_rating),
  };
}

function toDetail(game) {
  const heroId =
    game.artworks?.[0]?.image_id ?? game.screenshots?.[0]?.image_id ?? game.cover?.image_id;
  const developer = game.involved_companies?.find((item) => item.developer)?.company?.name;
  return {
    id: game.id,
    name: game.name ?? '',
    image: imageUrl(game.cover?.image_id, 'cover_big'),
    heroImage: imageUrl(heroId, '1080p'),
    released: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10)
      : null,
    rating: toFive(game.total_rating),
    developer: developer ?? null,
    platforms: (game.platforms ?? []).map((item) => item.name).filter(Boolean),
    description: typeof game.summary === 'string' ? game.summary.trim() : '',
  };
}

// Apicalypse no admite comillas ni barras invertidas sin escapar dentro de search.
const cleanSearch = (text) => text.replace(/["\\]/g, ' ').trim();

// --- Operaciones ---

// Listado paginado: { results, hasMore }. Se pide un elemento de más para saber si hay otra página.
async function listGames({ search, page, pageSize }) {
  const offset = (page - 1) * pageSize;
  const term = search ? cleanSearch(search) : '';
  const body = term
    ? `search "${term}"; fields ${LIST_FIELDS}; where game_type = ${GAME_TYPES}; limit ${pageSize + 1}; offset ${offset};`
    : `fields ${LIST_FIELDS}; where ${POPULAR_WHERE}; sort total_rating_count desc; limit ${pageSize + 1}; offset ${offset};`;
  const games = await igdbQuery('games', body);
  return {
    results: games.slice(0, pageSize).map(toListItem),
    hasMore: games.length > pageSize,
  };
}

// Un juego al azar entre los más votados: { id, name, image, platform, rating }.
async function getRandomGame() {
  const offset = Math.floor(Math.random() * RANDOM_POOL);
  const body = `fields ${LIST_FIELDS}; where ${POPULAR_WHERE}; sort total_rating_count desc; limit 1; offset ${offset};`;
  const [game] = await igdbQuery('games', body);
  if (!game) throw unavailable();
  return toListItem(game);
}

// Detalle normalizado de un juego.
async function getGame(gameId) {
  const [game] = await igdbQuery('games', `fields ${DETAIL_FIELDS}; where id = ${gameId};`);
  if (!game) throw serviceError(404, 'Juego no encontrado.', 'GAME_NOT_FOUND');
  return toDetail(game);
}

// Devuelve { id, name, description } (description puede ser '' si IGDB no tiene sinopsis).
async function getGameDescription(gameId) {
  const [game] = await igdbQuery('games', `fields name,summary; where id = ${gameId};`);
  if (!game) throw serviceError(404, 'Juego no encontrado.', 'GAME_NOT_FOUND');
  return {
    id: game.id,
    name: game.name ?? '',
    description: typeof game.summary === 'string' ? game.summary.trim() : '',
  };
}

// --- Correspondencia con Steam (A4-5) ---
// IGDB acepta hasta 500 resultados por consulta; los lotes de Steam son más pequeños.
const STEAM_SOURCE = 1; // external_game_source de Steam
const MAX_BATCH = 500;

// appids de Steam -> Map(appid -> id de IGDB) con external_games.
async function findSteamGames(appids) {
  const result = new Map();
  if (!appids.length) return result;
  const uids = appids.slice(0, MAX_BATCH).map((appid) => `"${Number(appid)}"`).join(',');
  const rows = await igdbQuery(
    'external_games',
    `fields game,uid; where external_game_source = ${STEAM_SOURCE} & uid = (${uids}); limit ${MAX_BATCH};`
  );
  for (const row of rows) {
    if (row.game && !result.has(Number(row.uid))) result.set(Number(row.uid), row.game);
  }
  return result;
}

// Nombres exactos -> Map(nombre -> id de IGDB). Solo juegos principales, remakes y ediciones.
// Si hay varios con el mismo nombre se prefiere el juego principal (game_type 0).
async function findGamesByName(names) {
  const result = new Map();
  const safe = [...new Set(names)].filter((name) => name && !/["\\]/.test(name)).slice(0, MAX_BATCH);
  if (!safe.length) return result;
  const list = safe.map((name) => `"${name}"`).join(',');
  const rows = await igdbQuery(
    'games',
    `fields id,name,game_type; where name = (${list}) & game_type = ${GAME_TYPES}; sort total_rating_count desc; limit ${MAX_BATCH};`
  );
  for (const row of rows) {
    const current = result.get(row.name);
    if (!current || (current.type !== 0 && row.game_type === 0)) {
      result.set(row.name, { id: row.id, type: row.game_type });
    }
  }
  return new Map([...result].map(([name, value]) => [name, value.id]));
}

// Resumen (nombre, portada, rating) de varios juegos por id.
async function getGamesByIds(ids) {
  const unique = [...new Set(ids)].slice(0, MAX_BATCH);
  if (!unique.length) return [];
  const games = await igdbQuery(
    'games',
    `fields ${LIST_FIELDS}; where id = (${unique.join(',')}); limit ${MAX_BATCH};`
  );
  return games.map(toListItem);
}

module.exports = {
  findSteamGames,
  findGamesByName,
  getGamesByIds,
  listGames,
  getRandomGame,
  getGame,
  getGameDescription,
  isCatalogConfigured: isConfigured,
};
