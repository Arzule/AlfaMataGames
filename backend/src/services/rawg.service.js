// Cliente de RAWG en el backend (la clave no sale del servidor).
const { createLogger } = require('../utils/logger');

const log = createLogger('rawg');

const BASE_URL = 'https://api.rawg.io/api';
const TIMEOUT_MS = 8000;

// Error con status HTTP para que el controlador responda sin adivinar.
function serviceError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

const isConfigured = () => Boolean(process.env.RAWG_API_KEY);

// Devuelve { id, name, description } (description puede ser '' si RAWG no tiene sinopsis).
async function getGameDescription(gameId) {
  if (!isConfigured()) {
    throw serviceError(503, 'El servicio de juegos no está configurado.', 'RAWG_NOT_CONFIGURED');
  }

  const params = new URLSearchParams({ key: process.env.RAWG_API_KEY });
  let response;
  try {
    response = await fetch(`${BASE_URL}/games/${gameId}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    // Solo la ruta: la URL completa lleva la clave.
    log.warn(`GET /games/${gameId} -> sin respuesta`, { error: err.name });
    throw serviceError(502, 'No se pudo contactar con RAWG.', 'RAWG_UNAVAILABLE');
  }

  if (response.status === 404) {
    throw serviceError(404, 'Juego no encontrado.', 'GAME_NOT_FOUND');
  }
  if (!response.ok) {
    log.warn(`GET /games/${gameId} -> ${response.status}`);
    throw serviceError(502, 'RAWG respondió con un error.', 'RAWG_UNAVAILABLE');
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name ?? '',
    description: typeof data.description_raw === 'string' ? data.description_raw.trim() : '',
  };
}

module.exports = { getGameDescription, isRawgConfigured: isConfigured };
