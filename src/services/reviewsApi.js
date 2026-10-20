// src/services/reviewsApi.js
// Reseñas de otros usuarios sobre un juego (requiere token).
import { request } from './apiClient';

// Página de reseñas, la más reciente primero: { items, page, hasMore }.
export function getGameReviews(gameId, { page = 1, pageSize = 10 } = {}) {
  return request(`/games/${gameId}/reviews?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
    auth: true,
  });
}
