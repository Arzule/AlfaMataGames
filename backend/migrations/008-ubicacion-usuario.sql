-- 008-ubicacion-usuario.sql
-- Ciudad del usuario para el Perfil. Las coordenadas se guardan redondeadas a 2 decimales
-- (unos 1,1 km): alcanzan para el mapa de la ciudad y no revelan la direccion exacta.
ALTER TABLE users
  ADD COLUMN city VARCHAR(120) NULL AFTER avatar,
  ADD COLUMN country VARCHAR(80) NULL AFTER city,
  ADD COLUMN location_lat DECIMAL(5,2) NULL AFTER country,
  ADD COLUMN location_lng DECIMAL(5,2) NULL AFTER location_lat,
  ADD COLUMN location_updated_at DATETIME NULL AFTER location_lng;
