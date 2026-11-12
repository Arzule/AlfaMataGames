-- 007-steam.sql
-- Conectar Steam e importar la biblioteca (A4-5).

-- Cuenta de Steam vinculada: una por usuario y cada cuenta de Steam a un solo usuario.
-- Steam no es un método de acceso (no cuenta para "último método de acceso").
CREATE TABLE IF NOT EXISTS steam_accounts (
    user_id      INT          NOT NULL PRIMARY KEY,
    steam_id     VARCHAR(20)  NOT NULL,
    persona_name VARCHAR(100) NULL,
    linked_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP    NULL,
    CONSTRAINT fk_steam_accounts_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE KEY uq_steam_accounts_steam (steam_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Caché compartida Steam (appid) -> IGDB. igdb_game_id NULL = no encontrado (se reintenta
-- pasado un tiempo). Guarda nombre, portada y rating de IGDB para no volver a pedirlos.
CREATE TABLE IF NOT EXISTS steam_igdb_map (
    appid        INT UNSIGNED NOT NULL PRIMARY KEY,
    steam_name   VARCHAR(255) NOT NULL,
    igdb_game_id INT          NULL,
    matched_by   ENUM('external', 'name') NULL,
    game_name    VARCHAR(255) NULL,
    game_image   VARCHAR(500) NULL,
    game_rating  DECIMAL(3,2) NULL,
    checked_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Juegos de Steam ya procesados por usuario. igdb_game_id NULL = aún no se agregó a la
-- biblioteca (no se encontró en IGDB). Si el usuario borra el juego de su biblioteca, la
-- re-sincronización no lo vuelve a agregar.
CREATE TABLE IF NOT EXISTS user_steam_games (
    user_id          INT          NOT NULL,
    appid            INT UNSIGNED NOT NULL,
    igdb_game_id     INT          NULL,
    playtime_minutes INT UNSIGNED NOT NULL DEFAULT 0,
    imported_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, appid),
    CONSTRAINT fk_user_steam_games_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Fuente del estado y del favorito: 'steam' (lo puso la importación, se puede actualizar) o
-- 'user' (lo cambió el usuario: Steam no lo vuelve a tocar). NULL = nunca se asignó.
ALTER TABLE user_games
    ADD COLUMN status_source   ENUM('steam', 'user') NULL AFTER status,
    ADD COLUMN favorite_source ENUM('steam', 'user') NULL AFTER is_favorite;

-- Lo que ya existe lo puso el usuario.
UPDATE user_games SET status_source = 'user' WHERE status IS NOT NULL;
UPDATE user_games SET favorite_source = 'user' WHERE is_favorite = 1;
