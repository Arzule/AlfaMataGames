// src/services/apiClient.js
// Cliente HTTP simple sobre fetch para hablar con el backend.
import { API_URL } from '@env';

const TIMEOUT_MS = 10000;

// Token de autenticación actual (en memoria) y manejador de sesión expirada.
let authToken = null;
let unauthorizedHandler = null;

// Define el token que se enviará en las peticiones autenticadas.
export function setAuthToken(token) {
  authToken = token || null;
}

// Registra la función a llamar cuando el token sea inválido o expire.
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null;
}

// Construye la URL completa a partir de API_URL.
function buildUrl(path) {
  const base = (API_URL || '').replace(/\/+$/, '');
  return `${base}${path}`;
}

/**
 * Realiza una petición al backend.
 * @param {string} path ruta relativa, ej. '/auth/login'
 * @param {Object} [options]
 * @param {string} [options.method] método HTTP (por defecto GET)
 * @param {Object} [options.body] cuerpo JSON opcional
 * @param {boolean} [options.auth] si debe enviar el token Bearer
 */
export async function request(path, { method = 'GET', body, auth = false } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = {};
  const hasBody = body !== undefined && body !== null;
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    // Sin conexión o tiempo de espera agotado.
    const error = new Error('No se pudo conectar con el servidor');
    error.status = 0;
    error.code = 'NETWORK_ERROR';
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  // El backend puede devolver 204 (sin contenido) o JSON.
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = null;
    }
  }

  if (!response.ok) {
    const error = new Error((data && data.message) || `Error ${response.status}`);
    error.status = response.status;
    error.code = data && data.code;

    // Token vencido o inválido en una petición autenticada: avisar a la app.
    if (
      auth &&
      response.status === 401 &&
      (error.code === 'TOKEN_EXPIRED' || error.code === 'TOKEN_INVALID') &&
      unauthorizedHandler
    ) {
      unauthorizedHandler();
    }

    throw error;
  }

  return data;
}
