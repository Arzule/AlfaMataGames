// src/services/notifications.js
// Notificaciones locales (expo-notifications): recordatorios de juegos y recordatorio diario.
// En web no hay soporte: Metro usa notifications.web.js con la misma API.
// Funcionan en Expo Go (solo las push remotas requieren el APK).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const NOTIFICATIONS_SUPPORTED = true;

const CHANNEL_ID = 'recordatorios';
const DAILY_ID = 'daily-reminder';
const gameReminderId = (gameId) => `game-${gameId}`;

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
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID);
}

export async function cancelReminder(identifier) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    // Nada que cancelar o módulo no disponible.
  }
}

// Recordatorios programados en un formato propio:
// { id, type: 'game' | 'daily', gameId?, gameName?, fireAt?, hour?, minute? }.
// Los de juego se ordenan por fecha; el diario va primero.
export async function listReminders() {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const items = (requests ?? [])
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
    return null;
  }
}
