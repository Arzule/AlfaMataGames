-- 009-push.sql
-- Push remotas (A4-6): tokens de Expo Push por dispositivo y recordatorios guardados en el
-- servidor. Un token pertenece a un solo usuario (si otro inicia sesion en el mismo telefono,
-- el token pasa a el). El diario usa game_id = 0 para que la clave unica evite duplicados.
CREATE TABLE push_tokens (
  token VARCHAR(255) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_push_tokens_user (user_id)
);

CREATE TABLE push_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('game', 'daily') NOT NULL,
  game_id INT NOT NULL DEFAULT 0,
  game_name VARCHAR(255) NULL,
  fire_at DATETIME NOT NULL,
  hour TINYINT NULL,
  minute TINYINT NULL,
  utc_offset SMALLINT NULL,
  CONSTRAINT fk_push_reminders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY uq_push_reminders (user_id, type, game_id),
  INDEX idx_push_reminders_fire (fire_at)
);
