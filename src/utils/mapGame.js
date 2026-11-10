// src/utils/mapGame.js
// Convierte un juego del catálogo (ya normalizado por el backend desde IGDB) al formato
// que consume GameCard.
export function mapCatalogGame(game) {
  return {
    id: game.id,
    title: game.name,
    image: game.image ?? null,
    platform: game.platform ?? null,
    rating: typeof game.rating === 'number' ? game.rating.toFixed(1) : null,
  };
}
