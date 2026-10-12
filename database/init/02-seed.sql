-- 02-seed.sql
-- Datos iniciales de prueba. Se ejecuta una sola vez al inicializar el contenedor.
-- Las contraseñas se almacenan como hash bcrypt (cost 10); nunca en texto plano.

SET NAMES utf8mb4;

-- Usuario: drago@gmail.com (nombre "Drago")
-- Usuario: demo@alfamatagames.com (nombre "Demo")
INSERT INTO users (name, email, password_hash) VALUES
    ('Drago', 'drago@gmail.com',          '$2b$10$oTs.Ozjw2j3St.FOkGpMjeHo6qh9OMwDB5Gb.RJNNxxBM8cfg5zUK'),
    ('Demo',  'demo@alfamatagames.com',   '$2b$10$XB2Tf9Py1vAZeMw/thso/eg4utXsVTHyYbUgVVaX1yThfQdit1Ffi');
