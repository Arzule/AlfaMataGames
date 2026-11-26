// src/services/pushApi.js
// Push remotas en el backend: token del dispositivo y recordatorios guardados en el servidor.
import { request } from './apiClient';

export function registerPushToken(token) {
  return request('/push/token', { method: 'PUT', body: { token }, auth: true });
}

// Sin sesión a propósito: al cerrar sesión con el token vencido igual se desregistra.
export function unregisterPushToken(token) {
  return request('/push/token', { method: 'DELETE', body: { token } });
}

// { items: [{ type: 'daily', hour, minute } | { type: 'game', gameId, gameName, fireAt }] }
export function getPushReminders() {
  return request('/push/reminders', { method: 'GET', auth: true });
}

export function saveGameReminder(gameId, gameName, fireAt) {
  return request(`/push/reminders/game/${gameId}`, {
    method: 'PUT',
    body: { gameName, fireAt },
    auth: true,
  });
}

export function deleteGameReminder(gameId) {
  return request(`/push/reminders/game/${gameId}`, { method: 'DELETE', auth: true });
}

export function saveDailyReminder(hour, minute, utcOffset) {
  return request('/push/reminders/daily', {
    method: 'PUT',
    body: { hour, minute, utcOffset },
    auth: true,
  });
}

export function deleteDailyReminder() {
  return request('/push/reminders/daily', { method: 'DELETE', auth: true });
}
