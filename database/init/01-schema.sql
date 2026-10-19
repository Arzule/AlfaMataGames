-- 01-schema.sql
-- Esquema base de AlfaMataGames (MySQL 8).
-- Este script se ejecuta automáticamente al inicializar el contenedor MySQL,
-- sobre la base de datos definida en MYSQL_DATABASE.
-- Los cambios de esquema nuevos van como migraciones en backend/migrations/.

SET NAMES utf8mb4;

-- Usuarios de la aplicación (login/registro).
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(80)  NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Biblioteca de juegos por usuario: progreso, favoritos y reseña de cada juego
-- (game_id corresponde al id del juego en la API de RAWG).
CREATE TABLE IF NOT EXISTS user_games (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    game_id     INT          NOT NULL,
    game_name   VARCHAR(255) NOT NULL,
    game_image  VARCHAR(500) NULL,
    game_rating DECIMAL(3,2) NULL,
    is_favorite TINYINT(1)   NOT NULL DEFAULT 0,
    status      ENUM('Jugando', 'Completado', 'Pendiente', 'Abandonado') NULL,
    user_score  TINYINT      NULL,
    review      TEXT         NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_games_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_user_games_score
        CHECK (user_score IS NULL OR user_score BETWEEN 0 AND 5),
    UNIQUE KEY uq_user_games (user_id, game_id),
    KEY idx_user_games_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
