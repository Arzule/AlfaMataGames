// src/services/rawgApi.js
import { RAWG_API_KEY } from '@env';

const BASE_URL = 'https://api.rawg.io/api';

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

  const response = await fetch(`${BASE_URL}/games?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Error al obtener juegos: ${response.status}`);
  }

  const data = await response.json();
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

  const response = await fetch(`${BASE_URL}/games/${id}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Error al obtener el detalle del juego: ${response.status}`);
  }

  return response.json();
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

  const response = await fetch(`${BASE_URL}/games?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Error al obtener un juego al azar: ${response.status}`);
  }

  const data = await response.json();
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

  const response = await fetch(`${BASE_URL}/genres?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Error al obtener géneros: ${response.status}`);
  }

  const data = await response.json();
  return data.results;
}
