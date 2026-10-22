// src/hooks/useDailyReminder.js
// Recordatorio diario configurable (Perfil): preferencia por usuario en AsyncStorage y
// notificación diaria programada a la hora elegida.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useNotificationPermission } from './useNotificationPermission';
import {
  NOTIFICATIONS_SUPPORTED,
  cancelDailyReminder,
  scheduleDailyReminder,
} from '../services/notifications';
import { getDailyReminderPref, setDailyReminderPref } from '../services/preferences';
import { formatTime } from '../utils/dateFormat';

export function useDailyReminder(userId) {
  const permission = useNotificationPermission();
  const [pref, setPref] = useState({ enabled: false, hour: 20, minute: 0 });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  // { type: 'success' | 'info' | 'error', text }
  const [feedback, setFeedback] = useState(null);

  // Se relee al enfocar Perfil (se puede desactivar desde la pantalla Recordatorios).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getDailyReminderPref(userId).then((value) => {
        if (!active) return;
        setPref(value);
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, [userId])
  );

  // Guarda la preferencia y programa o cancela la notificación según corresponda.
  const apply = useCallback(
    async (next) => {
      setFeedback(null);
      if (next.enabled) {
        const granted = await permission.ensure();
        if (!granted) {
          setFeedback({
            type: 'error',
            text: 'Sin permiso de notificaciones no se puede activar el recordatorio.',
          });
          return;
        }
      }
      setBusy(true);
      try {
        if (next.enabled) {
          await scheduleDailyReminder({ hour: next.hour, minute: next.minute, userId });
        } else {
          await cancelDailyReminder();
        }
        await setDailyReminderPref(userId, next);
        setPref(next);
        setFeedback(
          next.enabled
            ? {
                type: 'success',
                text: `Te recordaremos todos los días a las ${formatTime(next.hour, next.minute)}.`,
              }
            : { type: 'info', text: 'Recordatorio diario desactivado.' }
        );
      } catch (err) {
        setFeedback({ type: 'error', text: 'No se pudo actualizar el recordatorio diario.' });
      } finally {
        setBusy(false);
      }
    },
    [permission, userId]
  );

  const setEnabled = useCallback((enabled) => apply({ ...pref, enabled }), [apply, pref]);

  const setTime = useCallback(
    (date) => apply({ ...pref, hour: date.getHours(), minute: date.getMinutes() }),
    [apply, pref]
  );

  return {
    supported: NOTIFICATIONS_SUPPORTED,
    loaded,
    pref,
    busy,
    feedback,
    permissionStatus: permission.status,
    openSettings: permission.openSettings,
    setEnabled,
    setTime,
  };
}

export default useDailyReminder;
