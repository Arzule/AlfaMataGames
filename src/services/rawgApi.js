// src/services/rawgApi.js
import { RAWG_API_KEY } from '@env';
import { createLogger } from '../utils/logger';

const BASE_URL = 'https://api.rawg.io/api';
const log = createLogger('rawg');

// GET a RAWG. Registra solo la ruta y el status (la URL lleva la clave).
async function rawgGet(path, params, errorMessage) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}?${params.toString()}`);
  } catch (err) {
    log.info(`GET ${path} -> sin conexión`);
    throw err;
  }
  log.debug(`GET ${path} -> ${response.status}`);
  if (!response.ok) {
    log.warn(`GET ${path} -> ${response.status}`);
    throw new Error(`${errorMessage}: ${response.status}`);
  }
  return response.json();
}

/**
 * Obtiene un listado de videojuegos.
 * @param {Object} options
 * @param {string} [options.search] - texto de búsqueda
 * @param {number} [options.page] - número de página
 * @param {number} [options.pageSize] - resultados por página
 * @returns {Promise<{results: Array, hasMore: boolean}>}
 */
export async function getGames({ search = '', page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    key: RAWG_API_KEY,
    page: String(page),
    page_size: String(pageSize),
  });

  if (search) {
    params.append('search', search);
  }

  const data = await rawgGet('/games', params, 'Error al obtener juegos');

  return {
    results: Array.isArray(data.results) ? data.results : [],
    // RAWG devuelve `next` con la URL de la página siguiente (null al final).
    hasMore: data.next != null,
  };
}

/**
 * Obtiene el detalle completo de un videojuego por su id.
 * @param {number|string} id
 */
export async function getGameDetail(id) {
  const params = new URLSearchParams({ key: RAWG_API_KEY });

  return rawgGet(`/games/${id}`, params, 'Error al obtener el detalle del juego');
}

// Juegos populares entre los que se elige al azar (100 páginas x 40 = 4000 juegos).
const RANDOM_MAX_PAGE = 100;
const RANDOM_PAGE_SIZE = 40;

/**
 * Elige un juego al azar. RAWG no tiene endpoint aleatorio: se pide una página
 * aleatoria de los juegos más agregados y se toma un elemento al azar.
 * @returns {Promise<{id: number, name: string}>}
 */
export async function getRandomGame() {
  const page = 1 + Math.floor(Math.random() * RANDOM_MAX_PAGE);
  const params = new URLSearchParams({
    key: RAWG_API_KEY,
    page: String(page),
    page_size: String(RANDOM_PAGE_SIZE),
    ordering: '-added',
  });

  const data = await rawgGet('/games', params, 'Error al obtener un juego al azar');

  const results = Array.isArray(data.results) ? data.results.filter((g) => g?.id) : [];
  if (!results.length) {
    throw new Error('RAWG no devolvió juegos.');
  }
  return results[Math.floor(Math.random() * results.length)];
}

/**
 * Obtiene el listado de géneros disponibles en RAWG.
 */
export async function getGenres() {
  const params = new URLSearchParams({ key: RAWG_API_KEY });

  const data = await rawgGet('/genres', params, 'Error al obtener géneros');

  return data.results;
}
