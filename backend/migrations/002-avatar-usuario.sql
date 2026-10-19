-- 002-avatar-usuario.sql
-- Foto de perfil del usuario como data URI (JPEG de 256x256 en base64, unos 20-60 KB).
ALTER TABLE users ADD COLUMN avatar MEDIUMTEXT NULL AFTER password_hash;
