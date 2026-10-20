// src/hooks/useGameReminder.js
// "Recordarme jugar esto": programa, consulta y cancela el recordatorio de un juego.
// Todos los fallos terminan en un mensaje visible (feedback).
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { useNotificationPermission } from './useNotificationPermission';
import {
  NOTIFICATIONS_SUPPORTED,
  cancelReminder,
  getGameReminder,
  scheduleGameReminder,
} from '../services/notifications';
import { formatDateTime } from '../utils/dateFormat';

const HOUR_MS = 60 * 60 * 1000;
// Margen mínimo para aceptar una fecha elegida a mano.
const MIN_LEAD_MS = 60 * 1000;

// Opciones rápidas: devuelven la fecha del recordatorio a partir de ahora.
export const REMINDER_PRESETS = [
  { key: 'hour', label: 'En 1 hora', getDate: () => new Date(Date.now() + HOUR_MS) },
  { key: 'tomorrow', label: 'Mañana a esta hora', getDate: () => new Date(Date.now() + 24 * HOUR_MS) },
  { key: 'week', label: 'En una semana', getDate: () => new Date(Date.now() + 7 * 24 * HOUR_MS) },
];
// Solo en desarrollo, para probar sin esperar.
if (__DEV__) {
  REMINDER_PRESETS.unshift({
    key: 'test',
    label: 'En 1 minuto (prueba)',
    getDate: () => new Date(Date.now() + 60 * 1000),
  });
}

export function useGameReminder({ gameId, gameName }) {
  const { user } = useAuth();
  const permission = useNotificationPermission();
  const [reminder, setReminder] = useState(null);
  const [busy, setBusy] = useState(false);
  // { type: 'success' | 'info' | 'error', text }
  const [feedback, setFeedback] = useState(null);

  const refresh = useCallback(async () => {
    if (!NOTIFICATIONS_SUPPORTED) return;
    try {
      setReminder(await getGameReminder(gameId));
    } catch (err) {
      setReminder(null);
    }
  }, [gameId]);

  useEffect(() => {
    setFeedback(null);
  }, [gameId]);

  // Se relee al volver a la pantalla (pudo dispararse o cancelarse desde Recordatorios).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const schedule = useCallback(
    async (date) => {
      setFeedback(null);
      if (!NOTIFICATIONS_SUPPORTED) {
        setFeedback({ type: 'error', text: 'Los recordatorios solo funcionan en la app del celular.' });
        return false;
      }
      if (!(date instanceof Date) || date.getTime() < Date.now() + MIN_LEAD_MS) {
        setFeedback({ type: 'error', text: 'Elige una fecha y hora futuras.' });
        return false;
      }
      const granted = await permission.ensure();
      if (!granted) {
        setFeedback({
          type: 'error',
          text: 'Sin permiso de notificaciones no se puede programar el recordatorio.',
        });
        return false;
      }
      setBusy(true);
      try {
        await scheduleGameReminder({ gameId, gameName, date, userId: user?.id });
        await refresh();
        setFeedback({ type: 'success', text: `Te recordaremos jugar el ${formatDateTime(date)}.` });
        return true;
      } catch (err) {
        setFeedback({ type: 'error', text: 'No se pudo programar el recordatorio.' });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [gameId, gameName, user?.id, permission, refresh]
  );

  const cancel = useCallback(async () => {
    if (!reminder) return;
    setFeedback(null);
    setBusy(true);
    try {
      await cancelReminder(reminder.id);
      setReminder(null);
      setFeedback({ type: 'info', text: 'Recordatorio cancelado.' });
    } catch (err) {
      setFeedback({ type: 'error', text: 'No se pudo cancelar el recordatorio.' });
    } finally {
      setBusy(false);
    }
  }, [reminder]);

  return {
    supported: NOTIFICATIONS_SUPPORTED,
    reminder,
    busy,
    feedback,
    permissionStatus: permission.status,
    openSettings: permission.openSettings,
    schedule,
    cancel,
  };
}

export default useGameReminder;
