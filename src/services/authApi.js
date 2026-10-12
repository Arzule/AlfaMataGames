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
