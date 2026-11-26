// Proveedores OAuth 2.0 (Google y Discord): URL de autorización, canje del código y perfil.
// Las credenciales solo existen en el backend. Un proveedor sin credenciales no se ofrece.
const { createLogger } = require('../utils/logger');

const log = createLogger('oauth');

const TIMEOUT_MS = 10000;

const PROVIDERS = {
  google: {
    label: 'Google',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    extraParams: { prompt: 'select_account' },
    // userinfo de OpenID Connect: sub, email, email_verified, name.
    toProfile: (data) => ({
      id: String(data.sub),
      email: data.email ? String(data.email).toLowerCase() : null,
      emailVerified: data.email_verified === true,
      name: data.name || data.given_name || null,
    }),
  },
  discord: {
    label: 'Discord',
    clientIdEnv: 'DISCORD_CLIENT_ID',
    clientSecretEnv: 'DISCORD_CLIENT_SECRET',
    authorizeUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    profileUrl: 'https://discord.com/api/users/@me',
    scope: 'identify email',
    extraParams: { prompt: 'consent' },
    // /users/@me: id, username, global_name, email, verified.
    toProfile: (data) => ({
      id: String(data.id),
      email: data.email ? String(data.email).toLowerCase() : null,
      emailVerified: data.verified === true,
      name: data.global_name || data.username || null,
    }),
  },
};

function getProvider(name) {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, name) ? PROVIDERS[name] : null;
}

function isConfigured(name) {
  const provider = getProvider(name);
  return Boolean(
    provider && process.env[provider.clientIdEnv] && process.env[provider.clientSecretEnv]
  );
}

// Proveedores disponibles (con credenciales) para mostrar sus botones en la app.
function listConfigured() {
  return Object.keys(PROVIDERS)
    .filter(isConfigured)
    .map((name) => ({ id: name, label: PROVIDERS[name].label }));
}

// URL pública del callback del backend (la que se registra en Google y Discord).
function callbackUrl(name) {
  const base = (process.env.OAUTH_CALLBACK_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}/auth/oauth/${name}/callback`;
}

function authorizeUrl(name, state) {
  const provider = getProvider(name);
  const params = new URLSearchParams({
    client_id: process.env[provider.clientIdEnv],
    redirect_uri: callbackUrl(name),
    response_type: 'code',
    scope: provider.scope,
    state,
    ...provider.extraParams,
  });
  return `${provider.authorizeUrl}?${params}`;
}

async function fetchJson(url, options, what) {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    log.warn(`${what}: sin respuesta`, { error: err.message });
    throw Object.assign(new Error('El proveedor no responde.'), { code: 'PROVIDER_UNAVAILABLE' });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    // Solo el status: el cuerpo puede traer datos del usuario.
    log.warn(`${what}: status ${response.status}`);
    throw Object.assign(new Error('El proveedor rechazó la solicitud.'), {
      code: 'PROVIDER_ERROR',
    });
  }
  return data;
}

// Canjea el código de autorización y devuelve el perfil normalizado del usuario.
async function fetchProfile(name, code) {
  const provider = getProvider(name);
  const token = await fetchJson(
    provider.tokenUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: process.env[provider.clientIdEnv],
        client_secret: process.env[provider.clientSecretEnv],
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl(name),
      }),
    },
    `${name} token`
  );
  if (!token.access_token) {
    throw Object.assign(new Error('El proveedor no devolvió un token.'), { code: 'PROVIDER_ERROR' });
  }
  const data = await fetchJson(
    provider.profileUrl,
    { headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' } },
    `${name} perfil`
  );
  return provider.toProfile(data);
}

module.exports = {
  PROVIDERS,
  getProvider,
  isConfigured,
  listConfigured,
  callbackUrl,
  authorizeUrl,
  fetchProfile,
};
