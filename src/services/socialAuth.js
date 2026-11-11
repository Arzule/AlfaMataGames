// src/services/socialAuth.js
// Flujos con el navegador del sistema (expo-web-browser) + vuelta por deep link + PKCE:
// login social (Google y Discord) y conectar Steam.
// 1. Genera un secreto (codeVerifier) y su SHA-256 (codeChallenge).
// 2. Pide al backend la URL del proveedor (o de Steam) y la abre; el backend vuelve a `redirectUri` con un
//    código de un solo uso.
// 3. Canjea el código enviando el secreto: sin él, quien capture el deep link no obtiene nada.
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { startOAuth, exchangeCode } from './oauthApi';
import { startSteamLink, confirmSteamLink } from './steamApi';

// Mensajes para los códigos de error que devuelve el backend en el deep link.
const ERROR_MESSAGES = {
  EMAIL_NOT_VERIFIED: 'Tu correo en ese proveedor no está verificado. Verifícalo e inténtalo de nuevo.',
  PROVIDER_ALREADY_LINKED: 'Tu cuenta ya tiene otra cuenta de ese proveedor vinculada.',
  IDENTITY_TAKEN: 'Esa cuenta ya está vinculada a otro usuario de AlfaMataGames.',
  PROVIDER_UNAVAILABLE: 'El proveedor no responde. Inténtalo más tarde.',
  PROVIDER_ERROR: 'El proveedor rechazó el inicio de sesión. Inténtalo de nuevo.',
  STEAM_INVALID: 'Steam no confirmó el inicio de sesión. Inténtalo de nuevo.',
  STEAM_UNAVAILABLE: 'Steam no responde. Inténtalo más tarde.',
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

// Genera el PKCE, abre el navegador y canjea el código con `finish(code, codeVerifier)`.
// Devuelve la respuesta del canje, o null si el usuario cancela. Lanza Error con un mensaje para
// mostrar.
async function runBrowserFlow(start, finish) {
  const codeVerifier = toHex(Crypto.getRandomBytes(32));
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, codeVerifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  const redirectUri = getRedirectUri();

  const { url } = await start({ redirectUri, codeChallenge: toBase64Url(digest) });

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
  if (result.type !== 'success' || !result.url) return null;

  const params = readParams(result.url);
  if (params.error === 'CANCELLED') return null;
  if (params.error) {
    throw new Error(ERROR_MESSAGES[params.error] || 'No se pudo completar. Inténtalo de nuevo.');
  }
  if (!params.code) throw new Error('Respuesta inesperada del servidor');

  return finish(params.code, codeVerifier);
}

/** Login social o vincular un proveedor: { token, user } o { user, linked }; null si cancela. */
export function runOAuthFlow(provider, { link = false } = {}) {
  return runBrowserFlow((params) => startOAuth(provider, { ...params, link }), exchangeCode);
}

/** Conectar Steam: devuelve el estado de Steam actualizado, o null si cancela. */
export function runSteamLinkFlow() {
  return runBrowserFlow(startSteamLink, confirmSteamLink);
}
