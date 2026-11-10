-- 005-catalogo-igdb.sql
-- El catalogo pasa de RAWG a IGDB y los ids de juego no coinciden entre ambos.
-- Decision del proyecto: la biblioteca empieza de cero. Se borran las entradas guardadas
-- con ids de RAWG y las sinopsis traducidas en cache (se vuelven a generar con IGDB).
-- Los usuarios se conservan.
DELETE FROM user_games;
DELETE FROM game_translations;
