// src/services/notifications.js
// Notificaciones locales (expo-notifications): recordatorios de juegos y recordatorio diario.
// En web no hay soporte: Metro usa notifications.web.js con la misma API.
// En el APK (A4-6) los recordatorios se guardan en el servidor y llegan como push remotas
// (Expo Push -> FCM), así siguen al usuario aunque cambie de teléfono. En Expo Go, o si no se
// pudo registrar el token, se programan como notificaciones locales (respaldo).
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as pushApi from './pushApi';
import { createLogger } from '../utils/logger';

const log = createLogger('notificaciones');

export const NOTIFICATIONS_SUPPORTED = true;

const CHANNEL_ID = 'recordatorios';
const DAILY_ID = 'daily-reminder';
const gameReminderId = (gameId) => `game-${gameId}`;

// Expo Go no recibe push remotas en Android: ahí solo hay locales.
const PUSH_CAPABLE = Constants.executionEnvironment !== 'storeClient';

let pushToken = null;
let pushStarting = null;

// Obtiene el token de Expo Push y lo registra en el backend. Devuelve true si quedó activo.
// Solo con el permiso ya concedido (lo piden los hooks con su explicación previa).
function ensurePush() {
  if (pushToken) return Promise.resolve(true);
  if (!PUSH_CAPABLE) return Promise.resolve(false);
  if (!pushStarting) {
    pushStarting = (async () => {
      try {
        const permission = normalizePermission(await Notifications.getPermissionsAsync());
        if (!permission?.granted) return false;
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
        await pushApi.registerPushToken(data);
        pushToken = data;
        return true;
      } catch (err) {
        log.info('Push remotas no disponibles; se usan locales', { error: err?.message });
        return false;
      } finally {
        pushStarting = null;
      }
    })();
  }
  return pushStarting;
}

// Al iniciar sesión (o restaurarla): activa las push si el permiso ya estaba concedido.
export function startPushSession() {
  return ensurePush();
}

// Al cerrar sesión: el dispositivo deja de recibir los recordatorios de esa cuenta (quedan
// guardados en el servidor para la próxima vez).
export async function endPushSession() {
  const token = pushToken;
  pushToken = null;
  if (!token) return;
  try {
    await pushApi.unregisterPushToken(token);
  } catch (err) {
    log.info('No se pudo desregistrar el token de push', { error: err?.message });
  }
}

// Desfase horario para el diario del servidor (minutos a sumar a la hora local para UTC).
const utcOffset = () => new Date().getTimezoneOffset();

// Muestra las notificaciones también con la app abierta y crea el canal de Android
// (en Android 13+ el canal debe existir antes de pedir el permiso).
export async function configureNotifications() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Recordatorios',
        description: 'Recordatorios para jugar',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#8b5cf6',
      });
    }
  } catch (err) {
    log.warn('No se pudieron configurar las notificaciones', err);
    // Sin configuración las notificaciones no se muestran, pero la app sigue.
  }
}

// En iOS el permiso "provisional" también permite mostrar notificaciones.
function normalizePermission(response) {
  const provisional =
    response?.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  return provisional ? { ...response, granted: true } : response;
}

export async function getNotificationPermission() {
  return normalizePermission(await Notifications.getPermissionsAsync());
}

export async function requestNotificationPermission() {
  return normalizePermission(await Notifications.requestPermissionsAsync());
}

// Programa (o reemplaza) el recordatorio de un juego. Devuelve el identificador.
export async function scheduleGameReminder({ gameId, gameName, date, userId }) {
  const identifier = gameReminderId(gameId);
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  if (await ensurePush()) {
    await pushApi.saveGameReminder(gameId, gameName, date.getTime());
    return identifier;
  }
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: '¿Una partida?',
      body: `Es hora de jugar ${gameName}.`,
      data: { type: 'game', gameId, gameName, userId, fireAt: date.getTime() },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

// Programa (o reemplaza) el recordatorio diario a la hora indicada.
export async function scheduleDailyReminder({ hour, minute, userId }) {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  if (await ensurePush()) {
    await pushApi.saveDailyReminder(hour, minute, utcOffset());
    return DAILY_ID;
  }
  return Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'AlfaMataGames',
      body: '¿Qué vas a jugar hoy? Revisa tu biblioteca.',
      data: { type: 'daily', userId, hour, minute },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  if (pushToken) await pushApi.deleteDailyReminder();
}

// Cancela uno por identificador ('daily-reminder' o 'game-<id>'), local y en el servidor.
export async function cancelReminder(identifier) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  if (!pushToken) return;
  if (identifier === DAILY_ID) {
    await pushApi.deleteDailyReminder();
  } else if (identifier.startsWith('game-')) {
    await pushApi.deleteGameReminder(Number(identifier.slice(5)));
  }
}

// Recordatorios del servidor en el formato de listReminders ([] sin push activas).
async function listServerReminders() {
  if (!pushToken) return [];
  const data = await pushApi.getPushReminders();
  return (data?.items ?? []).map((item) =>
    item.type === 'daily'
      ? { id: DAILY_ID, type: 'daily', hour: item.hour, minute: item.minute }
      : {
          id: gameReminderId(item.gameId),
          type: 'game',
          gameId: item.gameId,
          gameName: item.gameName,
          fireAt: item.fireAt,
        }
  );
}

// Borra todos: los locales y, con push activas, los del servidor. Al cerrar sesión se llama
// después de endPushSession, así que ahí solo toca los locales.
export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    log.warn('No se pudieron cancelar los recordatorios', err);
  }
  if (!pushToken) return;
  const items = await listServerReminders();
  await Promise.all(items.map((item) => cancelReminder(item.id)));
}

// Recordatorios programados en un formato propio:
// { id, type: 'game' | 'daily', gameId?, gameName?, fireAt?, hour?, minute? }.
// Los de juego se ordenan por fecha; el diario va primero.
export async function listReminders() {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const local = (requests ?? [])
    .map((request) => {
      const data = request?.content?.data ?? {};
      if (data.type === 'game') {
        return {
          id: request.identifier,
          type: 'game',
          gameId: data.gameId,
          gameName: data.gameName,
          fireAt: data.fireAt,
        };
      }
      if (data.type === 'daily') {
        return { id: request.identifier, type: 'daily', hour: data.hour, minute: data.minute };
      }
      return null;
    })
    .filter(Boolean);
  // Con push activas se suman los del servidor (los locales quedan si se crearon sin conexión).
  let server = [];
  try {
    server = await listServerReminders();
  } catch (err) {
    log.info('No se pudieron leer los recordatorios del servidor', { error: err?.message });
  }
  const seen = new Set(server.map((item) => item.id));
  const items = [...server, ...local.filter((item) => !seen.has(item.id))];
  return items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'daily' ? -1 : 1;
    return (a.fireAt ?? 0) - (b.fireAt ?? 0);
  });
}

// Recordatorio activo de un juego, o null.
export async function getGameReminder(gameId) {
  const items = await listReminders();
  return items.find((item) => item.type === 'game' && item.gameId === gameId) ?? null;
}

// Datos de una notificación tocada: { key, data } (key evita procesarla dos veces).
function toTap(response) {
  if (!response) return null;
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  const { notification } = response;
  return {
    key: `${notification.request.identifier}:${notification.date}`,
    data: notification.request.content.data ?? {},
  };
}

// Escucha los toques en notificaciones. Devuelve la función para desuscribirse.
export function addNotificationTapListener(listener) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const tap = toTap(response);
    if (tap) listener(tap);
  });
  return () => subscription.remove();
}

// Notificación que abrió la app estando cerrada (o null).
export async function getInitialNotificationTap() {
  try {
    const tap = toTap(await Notifications.getLastNotificationResponseAsync());
    // Se limpia para no volver a abrir el mismo juego en el próximo arranque.
    if (tap) await Notifications.clearLastNotificationResponseAsync().catch(() => {});
    return tap;
  } catch (err) {
    log.warn('No se pudo leer la notificación inicial', err);
    return null;
  }
}
