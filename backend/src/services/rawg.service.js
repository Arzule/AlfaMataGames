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

// GET a RAWG con la clave del servidor. Registra solo la ruta (la URL lleva la clave).
async function rawgGet(path, query = {}) {
  if (!isConfigured()) {
    throw serviceError(503, 'El servicio de juegos no está configurado.', 'RAWG_NOT_CONFIGURED');
  }

  const params = new URLSearchParams({ key: process.env.RAWG_API_KEY });
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.append(name, String(value));
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}?${params}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    log.warn(`GET ${path} -> sin respuesta`, { error: err.name });
    throw serviceError(502, 'No se pudo contactar con RAWG.', 'RAWG_UNAVAILABLE');
  }

  if (response.status === 404) {
    throw serviceError(404, 'Juego no encontrado.', 'GAME_NOT_FOUND');
  }
  if (!response.ok) {
    log.warn(`GET ${path} -> ${response.status}`);
    throw serviceError(502, 'RAWG respondió con un error.', 'RAWG_UNAVAILABLE');
  }

  return response.json();
}

// Listado paginado: { results, hasMore }. No se reenvían next/previous (llevan la clave).
async function listGames({ search, page, pageSize, ordering }) {
  const data = await rawgGet('/games', { search, page, page_size: pageSize, ordering });
  return {
    results: Array.isArray(data.results) ? data.results : [],
    hasMore: data.next != null,
  };
}

// Detalle completo de un juego tal como lo entrega RAWG.
function getGame(gameId) {
  return rawgGet(`/games/${gameId}`);
}

// Devuelve { id, name, description } (description puede ser '' si RAWG no tiene sinopsis).
async function getGameDescription(gameId) {
  const data = await getGame(gameId);
  return {
    id: data.id,
    name: data.name ?? '',
    description: typeof data.description_raw === 'string' ? data.description_raw.trim() : '',
  };
}

module.exports = { listGames, getGame, getGameDescription, isRawgConfigured: isConfigured };
