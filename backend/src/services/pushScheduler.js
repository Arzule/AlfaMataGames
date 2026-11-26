// Programador de recordatorios push: cada minuto busca los vencidos y los envia.
// Corre dentro del backend (la VM esta siempre encendida); PUSH_SCHEDULER=false lo apaga.
const pool = require('../config/db');
const expoPush = require('./expoPush.service');
const { createLogger } = require('../utils/logger');

const log = createLogger('push');

const INTERVAL_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Un recordatorio que se perdio por mas de 6 h (servidor apagado) ya no se envia.
const STALE_MS = 6 * 60 * 60 * 1000;

function messageFor(reminder, token) {
  const base = { to: token, sound: 'default', channelId: 'recordatorios', priority: 'high' };
  if (reminder.type === 'game') {
    return {
      ...base,
      title: '¿Una partida?',
      body: `Es hora de jugar ${reminder.game_name}.`,
      data: {
        type: 'game',
        gameId: reminder.game_id,
        gameName: reminder.game_name,
        userId: reminder.user_id,
        fireAt: new Date(reminder.fire_at).getTime(),
      },
    };
  }
  return {
    ...base,
    title: 'AlfaMataGames',
    body: '¿Qué vas a jugar hoy? Revisa tu biblioteca.',
    data: { type: 'daily', userId: reminder.user_id, hour: reminder.hour, minute: reminder.minute },
  };
}

// Envia los recordatorios vencidos. Devuelve cuantos mensajes se enviaron.
async function dispatchDue(now = new Date()) {
  const [due] = await pool.query(
    'SELECT * FROM push_reminders WHERE fire_at <= ? ORDER BY fire_at LIMIT 500',
    [now]
  );
  if (!due.length) return 0;

  const userIds = [...new Set(due.map((r) => r.user_id))];
  const [tokens] = await pool.query('SELECT token, user_id FROM push_tokens WHERE user_id IN (?)', [
    userIds,
  ]);
  const messages = [];
  for (const reminder of due) {
    const fresh = now - new Date(reminder.fire_at) <= STALE_MS;
    if (!fresh) continue;
    tokens
      .filter((t) => t.user_id === reminder.user_id)
      .forEach((t) => messages.push(messageFor(reminder, t.token)));
  }

  const invalid = messages.length ? await expoPush.send(messages) : [];
  if (invalid.length) {
    await pool.query('DELETE FROM push_tokens WHERE token IN (?)', [invalid]);
  }

  // Los de juego se borran; el diario pasa al siguiente dia (saltando los dias perdidos).
  const gameIds = due.filter((r) => r.type === 'game').map((r) => r.id);
  if (gameIds.length) await pool.query('DELETE FROM push_reminders WHERE id IN (?)', [gameIds]);
  for (const reminder of due.filter((r) => r.type === 'daily')) {
    let next = new Date(reminder.fire_at).getTime();
    while (next <= now.getTime()) next += DAY_MS;
    await pool.query('UPDATE push_reminders SET fire_at = ? WHERE id = ?', [new Date(next), reminder.id]);
  }
  if (messages.length) log.info('Recordatorios push enviados', { count: messages.length });
  return messages.length;
}

let timer = null;
let running = false;

function start() {
  if (timer || process.env.PUSH_SCHEDULER === 'false') return;
  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await dispatchDue();
    } catch (err) {
      log.warn('Fallo el envio de recordatorios', { error: err.message });
    } finally {
      running = false;
    }
  }, INTERVAL_MS);
  timer.unref?.();
}

module.exports = { start, dispatchDue };
