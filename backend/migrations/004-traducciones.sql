-- 004-traducciones.sql
-- Cache de sinopsis traducidas: una fila por juego de RAWG e idioma destino.
-- source_hash (sha256 del texto original) permite detectar si RAWG cambio la descripcion.
-- Solo se guardan traducciones correctas: sin clave de DeepL o con error no se guarda nada,
-- para traducir en cuanto el servicio este disponible.
CREATE TABLE IF NOT EXISTS game_translations (
    game_id          INT          NOT NULL,
    lang             VARCHAR(8)   NOT NULL,
    source_hash      CHAR(64)     NOT NULL,
    source_lang      VARCHAR(8)   NULL,
    original_text    MEDIUMTEXT   NOT NULL,
    translated_text  MEDIUMTEXT   NOT NULL,
    provider         VARCHAR(20)  NOT NULL DEFAULT 'deepl',
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (game_id, lang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
