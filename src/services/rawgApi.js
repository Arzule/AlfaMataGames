// src/services/rawgApi.js
import { RAWG_API_KEY } from '@env';

const BASE_URL = 'https://api.rawg.io/api';

/**
 * Obtiene un listado de videojuegos.
 * @param {Object} options
 * @param {string} [options.search] - texto de búsqueda
 * @param {number} [options.page] - número de página
 * @param {number} [options.pageSize] - resultados por página
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
  return data.results;
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
