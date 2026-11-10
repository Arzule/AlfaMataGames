// src/utils/libraryStats.js
// Estadísticas de la biblioteca calculadas en la app a partir de LibraryContext,
// así siempre coinciden con lo que el usuario ve (incluidos los cambios optimistas).
export const STATS_STATUSES = ['Jugando', 'Completado', 'Pendiente', 'Abandonado'];

export function computeLibraryStats(items = []) {
  const byStatus = Object.fromEntries(STATS_STATUSES.map((status) => [status, 0]));
  let favorites = 0;
  let scoreSum = 0;
  let scored = 0;

  for (const item of items) {
    if (item.isFavorite) favorites += 1;
    if (item.status && byStatus[item.status] !== undefined) byStatus[item.status] += 1;
    if (Number.isInteger(item.userScore)) {
      scoreSum += item.userScore;
      scored += 1;
    }
  }

  return {
    total: items.length,
    favorites,
    byStatus,
    scored,
    // Media con un decimal; null si no hay juegos puntuados.
    averageScore: scored ? Math.round((scoreSum / scored) * 10) / 10 : null,
  };
}
