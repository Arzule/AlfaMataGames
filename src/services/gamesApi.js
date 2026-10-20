// src/services/gamesApi.js
// Información de juegos que sirve el backend (requiere token).
import { request } from './apiClient';

// Sinopsis en español:
// { gameId, lang, text, original, translated, source: 'cache'|'deepl'|null, notice }.
// notice: null | 'empty' | 'same-language' | 'not-configured' | 'quota' | 'unavailable'.
export function getGameDescription(gameId) {
  return request(`/games/${gameId}/description`, { method: 'GET', auth: true });
}
