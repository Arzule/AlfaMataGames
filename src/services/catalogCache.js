// src/services/catalogCache.js
// Caché del catálogo en la carpeta de caché del sistema (expo-file-system, Paths.cache).
// Android/iOS pueden vaciarla; "Borrar caché" en Información de la app la elimina sin
// cerrar sesión. En web se usa catalogCache.web.js. Ninguna función lanza errores.
import { Directory, File, Paths } from 'expo-file-system';
import { parseEntry, serializeEntry } from '../utils/cacheEntry';

const CATALOG_FILE = 'catalog-page1.json';

function cacheDir() {
  return new Directory(Paths.cache, 'alfamatagames');
}

// Primera página del catálogo guardada ({ savedAt, data }) o null si no hay o venció.
export async function readCatalogCache() {
  try {
    const file = new File(cacheDir(), CATALOG_FILE);
    if (!file.exists) return null;
    return parseEntry(await file.text());
  } catch (err) {
    return null;
  }
}

export async function writeCatalogCache(data) {
  try {
    const dir = cacheDir();
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, CATALOG_FILE);
    if (!file.exists) file.create();
    file.write(serializeEntry(data));
  } catch (err) {
    // Sin caché la app sigue funcionando.
  }
}

// Borra las entradas vencidas o ilegibles (se llama al iniciar la app).
export async function cleanExpiredCache() {
  try {
    const dir = cacheDir();
    if (!dir.exists) return;
    for (const item of dir.list()) {
      if (!(item instanceof File)) continue;
      let valid = false;
      try {
        valid = parseEntry(await item.text()) !== null;
      } catch (err) {
        valid = false;
      }
      if (!valid) item.delete();
    }
  } catch (err) {
    // Ignorar: se reintenta en el próximo inicio.
  }
}

// Borra toda la caché propia de la app.
export async function clearCatalogCache() {
  try {
    const dir = cacheDir();
    if (dir.exists) dir.delete();
  } catch (err) {
    // Ignorar.
  }
}
