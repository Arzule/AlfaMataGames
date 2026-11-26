-- 006-login-social.sql
-- Login con Google y Discord (A4-4).
-- Las cuentas creadas con un proveedor no tienen contraseña propia.
ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;

-- Identidades externas vinculadas: una por proveedor y usuario; cada identidad externa
-- pertenece a un solo usuario. Se borran con el usuario.
CREATE TABLE IF NOT EXISTS user_identities (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(64)  NOT NULL,
    email            VARCHAR(255) NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_identities_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE KEY uq_identity_provider_user (provider, provider_user_id),
    UNIQUE KEY uq_identity_user_provider (user_id, provider)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
