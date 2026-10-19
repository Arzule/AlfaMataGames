// src/utils/cacheEntry.js
// Formato común de las entradas de caché: { savedAt, data } con vencimiento de 7 días.
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Serializa los datos con la fecha de guardado.
export function serializeEntry(data) {
  return JSON.stringify({ savedAt: Date.now(), data });
}

// Devuelve { savedAt, data } si la entrada es válida y no venció; si no, null.
export function parseEntry(raw) {
  try {
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.savedAt !== 'number') return null;
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
    return entry;
  } catch (err) {
    return null;
  }
}
