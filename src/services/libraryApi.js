// src/services/libraryApi.js
// Funciones de la biblioteca del usuario contra el backend (requieren token).
import { request } from './apiClient';

// Obtiene la biblioteca del usuario. Opcionalmente solo los favoritos.
export function getLibrary({ favorite = false } = {}) {
  const path = favorite ? '/library?favorite=true' : '/library';
  return request(path, { method: 'GET', auth: true });
}

// Crea o actualiza (upsert parcial) la entrada de un juego.
export function saveEntry(gameId, patch) {
  return request(`/library/${gameId}`, { method: 'PUT', body: patch, auth: true });
}

// Elimina la entrada de un juego.
export function deleteEntry(gameId) {
  return request(`/library/${gameId}`, { method: 'DELETE', auth: true });
}
