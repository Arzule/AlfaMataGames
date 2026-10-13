// src/utils/mapGame.js
// Convierte el formato de RAWG al formato que consume GameCard.
export function mapRawgGame(game) {
  return {
    id: game.id,
    title: game.name,
    image: game.background_image,
    platform: game.platforms?.[0]?.platform?.name ?? null,
    rating: typeof game.rating === 'number' ? game.rating.toFixed(1) : null,
  };
}
