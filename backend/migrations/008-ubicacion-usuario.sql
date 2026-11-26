-- 008-ubicacion-usuario.sql
-- Ciudad y pais del usuario para el Perfil. No se guardan coordenadas: el GPS solo sirve
-- para obtener la ciudad (geocodificacion inversa) y se descarta.
ALTER TABLE users
  ADD COLUMN city VARCHAR(120) NULL AFTER avatar,
  ADD COLUMN country VARCHAR(80) NULL AFTER city,
  ADD COLUMN location_updated_at DATETIME NULL AFTER country;
