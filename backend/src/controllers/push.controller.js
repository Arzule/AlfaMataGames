// Push remotas: tokens del dispositivo y recordatorios guardados en el servidor.
const pool = require('../config/db');
const { isExpoToken } = require('../services/expoPush.service');

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_AHEAD_MS = 366 * DAY_MS;

const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

// Proxima vez (UTC) en que son hour:minute para un desfase dado (getTimezoneOffset: minutos
// que hay que sumar a la hora local para llegar a UTC; Lima = 300).
function nextDaily(hour, minute, utcOffset, now = Date.now()) {
  const local = new Date(now - utcOffset * 60000);
  let target =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour, minute) +
    utcOffset * 60000;
  if (target <= now) target += DAY_MS;
  return new Date(target);
}

function toItem(row) {
  if (row.type === 'daily') {
    return { type: 'daily', hour: row.hour, minute: row.minute };
  }
  return {
    type: 'game',
    gameId: row.game_id,
    gameName: row.game_name,
    fireAt: new Date(row.fire_at).getTime(),
  };
}

// PUT /push/token (requiere token) — body: { token }
async function registerToken(req, res, next) {
  try {
    const { token } = req.body || {};
    if (!isExpoToken(token)) return res.status(400).json({ message: 'Token de notificaciones no válido.' });
    await pool.query(
      `INSERT INTO push_tokens (token, user_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), updated_at = CURRENT_TIMESTAMP`,
      [token, req.userId]
    );
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

// DELETE /push/token — body: { token }. Sin sesión: al cerrar sesión con el token vencido
// el dispositivo igual debe dejar de recibir recordatorios.
async function unregisterToken(req, res, next) {
  try {
    const { token } = req.body || {};
    if (!isExpoToken(token)) return res.status(400).json({ message: 'Token de notificaciones no válido.' });
    await pool.query('DELETE FROM push_tokens WHERE token = ?', [token]);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

// GET /push/reminders (requiere token) — { items }: el diario primero y los de juego por fecha.
async function listReminders(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM push_reminders WHERE user_id = ?
       ORDER BY type = 'daily' DESC, fire_at ASC`,
      [req.userId]
    );
    return res.json({ items: rows.map(toItem) });
  } catch (err) {
    return next(err);
  }
}

// PUT /push/reminders/game/:gameId (requiere token) — body: { gameName, fireAt (ms) }
async function saveGameReminder(req, res, next) {
  try {
    const gameId = Number(req.params.gameId);
    const { gameName, fireAt } = req.body || {};
    const now = Date.now();
    if (!isInt(gameId, 1, 2147483647)) return res.status(400).json({ message: 'Juego no válido.' });
    if (typeof gameName !== 'string' || !gameName.trim() || gameName.length > 255) {
      return res.status(400).json({ message: 'Nombre del juego no válido.' });
    }
    if (!Number.isFinite(fireAt) || fireAt <= now || fireAt > now + MAX_AHEAD_MS) {
      return res.status(400).json({ message: 'La fecha del recordatorio debe ser futura.' });
    }
    await pool.query(
      `INSERT INTO push_reminders (user_id, type, game_id, game_name, fire_at)
       VALUES (?, 'game', ?, ?, ?)
       ON DUPLICATE KEY UPDATE game_name = VALUES(game_name), fire_at = VALUES(fire_at)`,
      [req.userId, gameId, gameName.trim(), new Date(fireAt)]
    );
    return res.json({ item: { type: 'game', gameId, gameName: gameName.trim(), fireAt } });
  } catch (err) {
    return next(err);
  }
}

// DELETE /push/reminders/game/:gameId (requiere token)
async function deleteGameReminder(req, res, next) {
  try {
    await pool.query("DELETE FROM push_reminders WHERE user_id = ? AND type = 'game' AND game_id = ?", [
      req.userId,
      Number(req.params.gameId) || 0,
    ]);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

// PUT /push/reminders/daily (requiere token) — body: { hour, minute, utcOffset }
async function saveDailyReminder(req, res, next) {
  try {
    const { hour, minute, utcOffset } = req.body || {};
    if (!isInt(hour, 0, 23) || !isInt(minute, 0, 59) || !isInt(utcOffset, -840, 840)) {
      return res.status(400).json({ message: 'Hora no válida.' });
    }
    await pool.query(
      `INSERT INTO push_reminders (user_id, type, game_id, fire_at, hour, minute, utc_offset)
       VALUES (?, 'daily', 0, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE fire_at = VALUES(fire_at), hour = VALUES(hour),
         minute = VALUES(minute), utc_offset = VALUES(utc_offset)`,
      [req.userId, nextDaily(hour, minute, utcOffset), hour, minute, utcOffset]
    );
    return res.json({ item: { type: 'daily', hour, minute } });
  } catch (err) {
    return next(err);
  }
}

// DELETE /push/reminders/daily (requiere token)
async function deleteDailyReminder(req, res, next) {
  try {
    await pool.query("DELETE FROM push_reminders WHERE user_id = ? AND type = 'daily'", [req.userId]);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  registerToken,
  unregisterToken,
  listReminders,
  saveGameReminder,
  deleteGameReminder,
  saveDailyReminder,
  deleteDailyReminder,
  nextDaily,
};
