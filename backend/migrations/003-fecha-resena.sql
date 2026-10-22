-- 003-fecha-resena.sql
-- Fecha de la ultima edicion de la resena (updated_at cambia con cualquier campo, como el
-- favorito) e indice para listar las resenas de un juego en orden cronologico.
ALTER TABLE user_games
    ADD COLUMN review_updated_at TIMESTAMP NULL AFTER review,
    ADD KEY idx_user_games_game_review (game_id, review_updated_at);

-- Resenas existentes: se toma la ultima modificacion conocida de la fila.
UPDATE user_games
   SET review_updated_at = updated_at
 WHERE review IS NOT NULL AND TRIM(review) <> '';
