// Envio de notificaciones por Expo Push Service (Expo las entrega por FCM en Android).
// Las credenciales FCM estan en EAS; el backend solo necesita los tokens.
const { createLogger } = require('../utils/logger');

const log = createLogger('push');

const SEND_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;
const TIMEOUT_MS = 15000;

const isExpoToken = (token) =>
  typeof token === 'string' && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token) && token.length <= 255;

// Envia los mensajes y devuelve los tokens que Expo marco como no registrados.
async function send(messages) {
  const invalid = [];
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    try {
      const response = await fetch(SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(body?.data)) {
        log.warn('Expo Push respondio con error', { status: response.status });
        continue;
      }
      body.data.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          if (ticket.details?.error === 'DeviceNotRegistered') invalid.push(chunk[index].to);
          else log.warn('Push rechazada', { error: ticket.details?.error || ticket.message });
        }
      });
    } catch (err) {
      log.warn('Expo Push no respondio', { error: err.name });
    }
  }
  return invalid;
}

module.exports = { send, isExpoToken };
