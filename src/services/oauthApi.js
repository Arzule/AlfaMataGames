// src/services/oauthApi.js
// Endpoints del login social (Google y Discord) en el backend.
import { request } from './apiClient';

// Proveedores configurados en el backend: { providers: [{ id, label }] }.
export function getProviders() {
  return request('/auth/oauth/providers', { method: 'GET' });
}

// Devuelve { url } del proveedor. Con link: true vincula a la sesión actual.
export function startOAuth(provider, { redirectUri, codeChallenge, link = false }) {
  return request(`/auth/oauth/${provider}/start`, {
    method: 'POST',
    body: { redirectUri, codeChallenge, link },
    auth: link,
  });
}

// Canjea el código de un solo uso: { token, user } al iniciar sesión o { user, linked } al vincular.
export function exchangeCode(code, codeVerifier) {
  return request('/auth/oauth/exchange', { method: 'POST', body: { code, codeVerifier } });
}

// Cuentas vinculadas: { identities: [{ provider, email, createdAt }], hasPassword }.
export function getIdentities() {
  return request('/auth/me/identities', { method: 'GET', auth: true });
}

export function unlinkIdentity(provider) {
  return request(`/auth/me/identities/${provider}`, { method: 'DELETE', auth: true });
}
