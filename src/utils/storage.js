// src/utils/storage.js
// Almacenamiento de sesión multiplataforma.
// - Nativo: expo-secure-store (almacenamiento cifrado).
// - Web: window.localStorage (SecureStore no funciona en web).
// Todas las funciones son asíncronas y nunca lanzan errores hacia afuera.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

// Devuelve localStorage si está disponible (SSR/entornos sin window -> null).
function getWebStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

// Lee un valor. Devuelve null si la clave no existe o si algo falla.
export async function getItem(key) {
  try {
    if (isWeb) {
      const storage = getWebStorage();
      return storage ? storage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    return null;
  }
}

// Guarda un valor. Un fallo se ignora silenciosamente.
export async function setItem(key, value) {
  try {
    if (isWeb) {
      const storage = getWebStorage();
      if (storage) storage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    // Nunca lanza.
  }
}

// Elimina un valor. Un fallo se ignora silenciosamente.
export async function removeItem(key) {
  try {
    if (isWeb) {
      const storage = getWebStorage();
      if (storage) storage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    // Nunca lanza.
  }
}
