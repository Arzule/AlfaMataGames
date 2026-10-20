// src/services/notifications.web.js
// expo-notifications no funciona en web: misma API sin efecto. La interfaz oculta las
// opciones de recordatorio y explica que solo están disponibles en el celular.
export const NOTIFICATIONS_SUPPORTED = false;

const unsupported = () =>
  Promise.reject(new Error('Las notificaciones no están disponibles en la versión web.'));

export async function configureNotifications() {}

export async function getNotificationPermission() {
  return null;
}

export async function requestNotificationPermission() {
  return null;
}

export const scheduleGameReminder = unsupported;
export const scheduleDailyReminder = unsupported;

export async function cancelDailyReminder() {}

export async function cancelReminder() {}

export async function cancelAllReminders() {}

export async function listReminders() {
  return [];
}

export async function getGameReminder() {
  return null;
}

export function addNotificationTapListener() {
  return () => {};
}

export async function getInitialNotificationTap() {
  return null;
}
