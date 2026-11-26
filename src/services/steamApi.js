// src/services/steamApi.js
// Endpoints de Steam en el backend (todos con sesión).
import { request } from './apiClient';

// { available, linked, steamId, personaName, lastSyncAt, sync }
export function getSteamStatus() {
  return request('/steam', { method: 'GET', auth: true });
}

// Devuelve { url } de Steam OpenID.
export function startSteamLink({ redirectUri, codeChallenge }) {
  return request('/steam/link/start', { method: 'POST', body: { redirectUri, codeChallenge }, auth: true });
}

// Confirma la vinculación con el código del deep link; devuelve el estado actualizado.
export function confirmSteamLink(code, codeVerifier) {
  return request('/steam/link/confirm', { method: 'POST', body: { code, codeVerifier }, auth: true });
}

export function unlinkSteam() {
  return request('/steam', { method: 'DELETE', auth: true });
}

// Empieza una sincronización: { sync: { total, processed, added, updated, notFoundCount, done } }.
export function startSteamSync() {
  return request('/steam/sync', { method: 'POST', auth: true });
}

// Procesa el siguiente lote; al terminar, sync.notFound lista los juegos no encontrados.
export function nextSteamSync() {
  return request('/steam/sync/next', { method: 'POST', auth: true });
}
