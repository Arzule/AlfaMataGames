// src/services/gamesApi.js
// Información de juegos que sirve el backend (requiere token). El backend consulta RAWG
// con su propia clave: la app nunca la conoce.
import { request } from './apiClient';

/**
 * Obtiene un listado de videojuegos.
 * @param {Object} options
 * @param {string} [options.search] - texto de búsqueda
 * @param {number} [options.page] - número de página
 * @param {number} [options.pageSize] - resultados por página
 * @returns {Promise<{results: Array, hasMore: boolean}>}
 */
export async function getGames({ search = '', page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) {
    params.append('search', search);
  }
  const data = await request(`/games?${params.toString()}`, { method: 'GET', auth: true });
  return {
    results: Array.isArray(data.results) ? data.results : [],
    hasMore: Boolean(data.hasMore),
  };
}

/**
 * Obtiene el detalle completo de un videojuego por su id.
 * @param {number|string} id
 */
export function getGameDetail(id) {
  return request(`/games/${id}`, { method: 'GET', auth: true });
}

/**
 * Elige un juego al azar entre los más populares (lo resuelve el backend).
 * @returns {Promise<{id: number, name: string}>}
 */
export function getRandomGame() {
  return request('/games/random', { method: 'GET', auth: true });
}

// Sinopsis en español:
// { gameId, lang, text, original, translated, source: 'cache'|'deepl'|null, notice }.
// notice: null | 'empty' | 'same-language' | 'not-configured' | 'quota' | 'unavailable'.
export function getGameDescription(gameId) {
  return request(`/games/${gameId}/description`, { method: 'GET', auth: true });
}
