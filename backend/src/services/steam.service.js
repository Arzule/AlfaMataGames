// Steam: verificación de la cuenta con Steam OpenID 2.0 y Web API (perfil y juegos).
// La clave de la Web API (STEAM_API_KEY) solo existe en el backend.
const { createLogger } = require('../utils/logger');

const log = createLogger('steam');

const OPENID_URL = 'https://steamcommunity.com/openid/login';
const API_URL = 'https://api.steampowered.com';
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';
const CLAIMED_ID_REGEX = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;
const TIMEOUT_MS = 10000;

const isConfigured = () => Boolean(process.env.STEAM_API_KEY);

function steamError(code, status = 502) {
  return Object.assign(new Error(code), { code, status });
}

// URL de inicio de sesión de Steam. return_to debe quedar dentro de realm.
function loginUrl(returnTo, realm) {
  const params = new URLSearchParams({
    'openid.ns': OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT,
  });
  return `${OPENID_URL}?${params}`;
}

// Verifica la respuesta de Steam (parámetros openid.* del callback) preguntándole a Steam
// si la firma es suya (check_authentication). Devuelve el SteamID64 o lanza un error.
async function verifyLogin(query, expectedReturnTo) {
  if (query['openid.mode'] !== 'id_res') throw steamError('CANCELLED', 400);
  const match = CLAIMED_ID_REGEX.exec(String(query['openid.claimed_id'] || ''));
  const returnTo = String(query['openid.return_to'] || '');
  if (
    !match ||
    query['openid.op_endpoint'] !== OPENID_URL ||
    !returnTo.startsWith(expectedReturnTo)
  ) {
    throw steamError('STEAM_INVALID', 400);
  }

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('openid.')) body.set(key, String(value));
  }
  body.set('openid.mode', 'check_authentication');

  let text;
  try {
    const response = await fetch(OPENID_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    text = await response.text();
  } catch (err) {
    log.warn('check_authentication -> sin respuesta', { error: err.name });
    throw steamError('STEAM_UNAVAILABLE');
  }
  if (!/^is_valid\s*:\s*true\s*$/m.test(text)) throw steamError('STEAM_INVALID', 400);
  return match[1];
}

async function apiGet(path, params) {
  const query = new URLSearchParams({ key: process.env.STEAM_API_KEY, ...params });
  let response;
  try {
    response = await fetch(`${API_URL}${path}?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    log.warn(`GET ${path} -> sin respuesta`, { error: err.name });
    throw steamError('STEAM_UNAVAILABLE');
  }
  if (!response.ok) {
    log.warn(`GET ${path} -> ${response.status}`);
    throw steamError('STEAM_UNAVAILABLE');
  }
  return response.json();
}

// Nombre público del perfil (o null si no se pudo obtener).
async function getPersonaName(steamId) {
  try {
    const data = await apiGet('/ISteamUser/GetPlayerSummaries/v2/', { steamids: steamId });
    return data?.response?.players?.[0]?.personaname?.slice(0, 100) || null;
  } catch (err) {
    return null;
  }
}

// Juegos de la cuenta: [{ appid, name, playtime }] (minutos). Si los detalles de juego del
// perfil no son públicos, Steam responde sin game_count: PRIVATE_PROFILE.
async function getOwnedGames(steamId) {
  const data = await apiGet('/IPlayerService/GetOwnedGames/v1/', {
    steamid: steamId,
    include_appinfo: '1',
    include_played_free_games: '1',
  });
  const response = data?.response;
  if (!response || typeof response.game_count !== 'number') {
    throw steamError('PRIVATE_PROFILE', 409);
  }
  return (response.games || [])
    .filter((game) => Number.isInteger(game.appid) && game.name)
    .map((game) => ({
      appid: game.appid,
      name: String(game.name).slice(0, 255),
      playtime: Number(game.playtime_forever) || 0,
    }));
}

module.exports = { isConfigured, loginUrl, verifyLogin, getPersonaName, getOwnedGames };
