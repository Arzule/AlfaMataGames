// src/services/catalogCache.web.js
// Versión web de la caché del catálogo: expo-file-system no funciona en web,
// así que se usa AsyncStorage (localStorage). Misma API que catalogCache.js.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseEntry, serializeEntry } from '../utils/cacheEntry';

const PREFIX = 'alfamatagames.cache.';
const CATALOG_KEY = `${PREFIX}catalog-page1`;

export async function readCatalogCache() {
  try {
    const raw = await AsyncStorage.getItem(CATALOG_KEY);
    return raw ? parseEntry(raw) : null;
  } catch (err) {
    return null;
  }
}

export async function writeCatalogCache(data) {
  try {
    await AsyncStorage.setItem(CATALOG_KEY, serializeEntry(data));
  } catch (err) {
    // Sin caché la app sigue funcionando.
  }
}

export async function cleanExpiredCache() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
    for (const key of keys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw || !parseEntry(raw)) await AsyncStorage.removeItem(key);
    }
  } catch (err) {
    // Ignorar.
  }
}

export async function clearCatalogCache() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch (err) {
    // Ignorar.
  }
}
