// Login social (Google y Discord) mediado por el backend.
//
// Flujo:
//  1. La app pide POST /auth/oauth/:provider/start con su redirectUri (deep link) y un
//     codeChallenge (PKCE: SHA-256 de un secreto que solo conoce la app).
//  2. El backend devuelve la URL del proveedor con un `state` firmado (10 min) que guarda el
//     proveedor, el redirectUri ya validado, el challenge y, al vincular, el id del usuario.
//  3. El proveedor vuelve a GET /auth/oauth/:provider/callback; el backend canjea el código,
//     resuelve la cuenta y redirige al deep link con un código de un solo uso (2 min).
//  4. La app canjea ese código con POST /auth/oauth/exchange enviando el secreto (codeVerifier):
//     aunque otra app capture el deep link, sin el secreto no obtiene la sesión.
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { signToken, publicUser, findUser } = require('../utils/users');
const oneTimeCodes = require('../utils/oneTimeCodes');
const oauth = require('../services/oauth.service');
const { createLogger } = require('../utils/logger');

const log = createLogger('oauth');

const STATE_AUDIENCE = 'oauth-state';
const STATE_TTL = '10m';
const APP_SCHEME = 'alfamatagames:';

function oauthError(code) {
  return Object.assign(new Error(code), { code });
}

// Destinos permitidos para volver a la app (lista permitida, nunca una URL arbitraria):
// - APK: esquema propio alfamatagames://
// - Expo Go: exp://<ip>:<puerto>/--/oauth (OAUTH_ALLOW_EXPO_GO; por defecto solo fuera de producción)
// - Web: prefijos exactos de OAUTH_WEB_REDIRECTS (por defecto http://localhost:8081/oauth)
function isAllowedRedirect(uri) {
  if (typeof uri !== 'string' || uri.length > 300) return false;
  let url;
  try {
    url = new URL(uri);
  } catch (err) {
    return false;
  }
  if (url.protocol === APP_SCHEME) return true;

  const allowExpoGo =
    // Vacío (docker-compose pasa "" si no se define) = valor por defecto.
    (process.env.OAUTH_ALLOW_EXPO_GO || (process.env.NODE_ENV === 'production' ? 'false' : 'true')) ===
    'true';
  if (url.protocol === 'exp:') return allowExpoGo && url.pathname.endsWith('/--/oauth');

  const webRedirects = (process.env.OAUTH_WEB_REDIRECTS || 'http://localhost:8081/oauth')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const target = `${url.origin}${url.pathname}`;
  return webRedirects.includes(target);
}

function withQuery(uri, params) {
  const query = new URLSearchParams(params).toString();
  return `${uri}${uri.includes('?') ? '&' : '?'}${query}`;
}

// Nombre inicial de una cuenta nueva: el del proveedor o la parte local del correo.
function initialName(profile) {
  const candidates = [profile.name, (profile.email || '').split('@')[0]];
  for (const candidate of candidates) {
    const name = (candidate || '').trim().slice(0, 80);
    if (name.length >= 2) return name;
  }
  return 'Jugador';
}

function isDuplicate(err) {
  return err && err.code === 'ER_DUP_ENTRY';
}

// Login: identidad conocida → su usuario; correo verificado coincidente → vincular;
// si no, cuenta nueva sin contraseña. Sin correo verificado no se crea ni vincula nada.
async function resolveLogin(provider, profile) {
  const [identities] = await pool.query(
    'SELECT user_id FROM user_identities WHERE provider = ? AND provider_user_id = ?',
    [provider, profile.id]
  );
  if (identities.length) return identities[0].user_id;

  if (!profile.email || !profile.emailVerified) throw oauthError('EMAIL_NOT_VERIFIED');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query('SELECT id FROM users WHERE email = ? FOR UPDATE', [
      profile.email,
    ]);
    let userId;
    if (users.length) {
      userId = users[0].id;
      // Ya tiene otra cuenta de este proveedor vinculada: no se mezclan identidades.
      const [linked] = await connection.query(
        'SELECT 1 FROM user_identities WHERE user_id = ? AND provider = ?',
        [userId, provider]
      );
      if (linked.length) throw oauthError('PROVIDER_ALREADY_LINKED');
    } else {
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, NULL)',
        [initialName(profile), profile.email]
      );
      userId = result.insertId;
    }
    await connection.query(
      'INSERT INTO user_identities (user_id, provider, provider_user_id, email) VALUES (?, ?, ?, ?)',
      [userId, provider, profile.id, profile.email]
    );
    await connection.commit();
    return userId;
  } catch (err) {
    await connection.rollback();
    // Dos callbacks simultáneos de la misma persona: el otro ya creó la identidad.
    if (isDuplicate(err)) throw oauthError('TRY_AGAIN');
    throw err;
  } finally {
    connection.release();
  }
}

// Vincular desde Perfil: la identidad no puede pertenecer a otro usuario.
async function resolveLink(userId, provider, profile) {
  const [identities] = await pool.query(
    'SELECT user_id FROM user_identities WHERE provider = ? AND provider_user_id = ?',
    [provider, profile.id]
  );
  if (identities.length) {
    if (identities[0].user_id !== userId) throw oauthError('IDENTITY_TAKEN');
    return;
  }
  try {
    await pool.query(
      'INSERT INTO user_identities (user_id, provider, provider_user_id, email) VALUES (?, ?, ?, ?)',
      [userId, provider, profile.id, profile.email]
    );
  } catch (err) {
    if (isDuplicate(err)) throw oauthError('PROVIDER_ALREADY_LINKED');
    throw err;
  }
}

// GET /auth/oauth/providers — proveedores configurados (para mostrar los botones).
function providers(req, res) {
  res.json({ providers: oauth.listConfigured() });
}

// POST /auth/oauth/:provider/start — body: { redirectUri, codeChallenge, link? }
// Con link: true exige sesión (Bearer) y vincula al usuario actual.
function start(req, res) {
  const { provider } = req.params;
  if (!oauth.isConfigured(provider)) {
    return res.status(404).json({ message: 'Proveedor no disponible.', code: 'PROVIDER_UNAVAILABLE' });
  }
  const { redirectUri, codeChallenge, link } = req.body || {};
  if (!isAllowedRedirect(redirectUri)) {
    return res.status(400).json({ message: 'Dirección de retorno no permitida.' });
  }
  if (!oneTimeCodes.isValidChallenge(codeChallenge)) {
    return res.status(400).json({ message: 'codeChallenge inválido.' });
  }
  if (link && !req.userId) {
    return res.status(401).json({ message: 'No autenticado', code: 'TOKEN_INVALID' });
  }

  const state = jwt.sign(
    { p: provider, r: redirectUri, c: codeChallenge, u: link ? req.userId : null },
    process.env.JWT_SECRET,
    { expiresIn: STATE_TTL, audience: STATE_AUDIENCE }
  );
  return res.json({ url: oauth.authorizeUrl(provider, state) });
}

// Página mínima cuando no se puede volver a la app (state vencido o manipulado).
function sendFailurePage(res) {
  res
    .status(400)
    .type('html')
    .send(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
        '<title>AlfaMataGames</title><p style="font-family:sans-serif;padding:24px">' +
        'El enlace de inicio de sesión venció o no es válido. Cierra esta ventana y vuelve a ' +
        'intentarlo desde la app.</p>'
    );
}

// GET /auth/oauth/:provider/callback — la llamada del proveedor tras autorizar.
async function callback(req, res) {
  const { provider } = req.params;
  let state;
  try {
    state = jwt.verify(String(req.query.state || ''), process.env.JWT_SECRET, {
      audience: STATE_AUDIENCE,
    });
  } catch (err) {
    return sendFailurePage(res);
  }
  // El redirectUri se validó al firmar; se vuelve a comprobar por si cambió la configuración.
  if (state.p !== provider || !isAllowedRedirect(state.r)) return sendFailurePage(res);

  const back = (params) => res.redirect(302, withQuery(state.r, params));

  // El usuario canceló o el proveedor devolvió un error.
  if (req.query.error || !req.query.code) return back({ error: 'CANCELLED' });

  try {
    const profile = await oauth.fetchProfile(provider, String(req.query.code));
    let userId;
    if (state.u) {
      await resolveLink(state.u, provider, profile);
      userId = state.u;
    } else {
      userId = await resolveLogin(provider, profile);
    }
    const code = oneTimeCodes.create({
      kind: 'oauth',
      userId,
      mode: state.u ? 'link' : 'login',
      provider,
      challenge: state.c,
    });
    return back({ code });
  } catch (err) {
    if (!err.code || !/^[A-Z_]+$/.test(err.code)) {
      log.error('Error en el callback de OAuth', { provider, error: err.message });
      return back({ error: 'SERVER_ERROR' });
    }
    log.info(`Login social rechazado: ${err.code}`, { provider });
    return back({ error: err.code });
  }
}

// POST /auth/oauth/exchange — body: { code, codeVerifier }
async function exchange(req, res, next) {
  try {
    const { code, codeVerifier } = req.body || {};
    const { payload: pending, error } = oneTimeCodes.consume(code, codeVerifier);
    if (error === 'CODE_EXPIRED' || (pending && pending.kind !== 'oauth')) {
      return res.status(400).json({ message: 'El inicio de sesión venció. Inténtalo de nuevo.', code: 'CODE_EXPIRED' });
    }
    if (error) {
      return res.status(400).json({ message: 'codeVerifier inválido.', code: 'INVALID_VERIFIER' });
    }

    const user = await findUser(pending.userId);
    if (!user) {
      return res.status(400).json({ message: 'La cuenta ya no existe.', code: 'CODE_EXPIRED' });
    }
    if (pending.mode === 'link') {
      return res.json({ user: publicUser(user), linked: pending.provider });
    }
    return res.json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

async function listIdentities(userId) {
  const [rows] = await pool.query(
    'SELECT provider, email, created_at FROM user_identities WHERE user_id = ? ORDER BY created_at',
    [userId]
  );
  return rows.map((row) => ({ provider: row.provider, email: row.email, createdAt: row.created_at }));
}

// GET /auth/me/identities — cuentas vinculadas del usuario.
async function identities(req, res, next) {
  try {
    const user = await findUser(req.userId);
    return res.json({ identities: await listIdentities(req.userId), hasPassword: Boolean(user?.password_hash) });
  } catch (err) {
    return next(err);
  }
}

// DELETE /auth/me/identities/:provider — nunca deja la cuenta sin forma de entrar.
async function unlink(req, res, next) {
  try {
    const { provider } = req.params;
    const user = await findUser(req.userId);
    const current = await listIdentities(req.userId);
    if (!current.some((identity) => identity.provider === provider)) {
      return res.status(404).json({ message: 'Esa cuenta no está vinculada.' });
    }
    if (!user.password_hash && current.length <= 1) {
      return res.status(400).json({
        message: 'Es tu único método de acceso. Vincula otra cuenta antes de quitar esta.',
        code: 'LAST_LOGIN_METHOD',
      });
    }
    await pool.query('DELETE FROM user_identities WHERE user_id = ? AND provider = ?', [
      req.userId,
      provider,
    ]);
    return res.json({ identities: await listIdentities(req.userId), hasPassword: Boolean(user.password_hash) });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  providers,
  start,
  callback,
  exchange,
  identities,
  unlink,
  // Compartidos con Steam (steam.controller.js) y con las pruebas.
  isAllowedRedirect,
  withQuery,
  sendFailurePage,
};
