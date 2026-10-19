// src/services/authApi.js
// Funciones de autenticación contra el backend.
import { request } from './apiClient';

// Inicia sesión con correo y contraseña.
export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// Registra un usuario nuevo.
export function register(name, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

// Obtiene el usuario del token actual.
export function getMe() {
  return request('/auth/me', { method: 'GET', auth: true });
}

// Sube la foto de perfil (data URI JPEG en base64). Devuelve { user }.
export function uploadAvatar(image) {
  return request('/auth/me/avatar', { method: 'PUT', body: { image }, auth: true });
}

// Elimina la foto de perfil. Devuelve { user }.
export function deleteAvatar() {
  return request('/auth/me/avatar', { method: 'DELETE', auth: true });
}
