// src/services/socialAuth.js
// Flujo de login social: navegador del sistema (expo-web-browser) + vuelta por deep link + PKCE.
// 1. Genera un secreto (codeVerifier) y su SHA-256 (codeChallenge).
// 2. Pide al backend la URL del proveedor y la abre; el backend vuelve a `redirectUri` con un
//    código de un solo uso.
// 3. Canjea el código enviando el secreto: sin él, quien capture el deep link no obtiene nada.
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { startOAuth, exchangeCode } from './oauthApi';

// Mensajes para los códigos de error que devuelve el backend en el deep link.
const ERROR_MESSAGES = {
  EMAIL_NOT_VERIFIED: 'Tu correo en ese proveedor no está verificado. Verifícalo e inténtalo de nuevo.',
  PROVIDER_ALREADY_LINKED: 'Tu cuenta ya tiene otra cuenta de ese proveedor vinculada.',
  IDENTITY_TAKEN: 'Esa cuenta ya está vinculada a otro usuario de AlfaMataGames.',
  PROVIDER_UNAVAILABLE: 'El proveedor no responde. Inténtalo más tarde.',
  PROVIDER_ERROR: 'El proveedor rechazó el inicio de sesión. Inténtalo de nuevo.',
  TRY_AGAIN: 'No se pudo completar. Inténtalo de nuevo.',
  SERVER_ERROR: 'Error del servidor. Inténtalo más tarde.',
};

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(base64) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Lee los parámetros de la URL de retorno sin depender de URL (no es completa en Hermes).
function readParams(url) {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const params = {};
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const [key, value = ''] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return params;
}

// Dirección de retorno: Expo Go exp://.../--/oauth, APK alfamatagames://oauth, web <origen>/oauth.
export function getRedirectUri() {
  return Linking.createURL('oauth');
}

/**
 * Ejecuta el flujo completo. Devuelve la respuesta del canje, o null si el usuario cancela.
 * Lanza Error con un mensaje para mostrar.
 */
export async function runOAuthFlow(provider, { link = false } = {}) {
  const codeVerifier = toHex(Crypto.getRandomBytes(32));
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  const redirectUri = getRedirectUri();

  const { url } = await startOAuth(provider, {
    redirectUri,
    codeChallenge: toBase64Url(digest),
    link,
  });

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
  if (result.type !== 'success' || !result.url) return null;

  const params = readParams(result.url);
  if (params.error === 'CANCELLED') return null;
  if (params.error) {
    throw new Error(ERROR_MESSAGES[params.error] || 'No se pudo iniciar sesión. Inténtalo de nuevo.');
  }
  if (!params.code) throw new Error('Respuesta inesperada del servidor');

  return exchangeCode(params.code, codeVerifier);
}
