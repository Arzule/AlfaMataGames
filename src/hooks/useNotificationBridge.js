// src/hooks/useNotificationBridge.js
// Conecta las notificaciones con la navegación y la sesión:
// - Tocar un recordatorio abre el detalle del juego (o el Catálogo si es el diario),
//   también cuando la notificación abrió la app cerrada.
// - Si el toque llega antes de restaurar la sesión, se guarda y se aplica después.
// - Al iniciar sesión se vuelve a programar el recordatorio diario si estaba activado
//   (al cerrar sesión se cancelan todas).
import { useCallback, useEffect, useRef } from 'react';
import {
  NOTIFICATIONS_SUPPORTED,
  addNotificationTapListener,
  getInitialNotificationTap,
  getNotificationPermission,
  scheduleDailyReminder,
} from '../services/notifications';
import { getDailyReminderPref } from '../services/preferences';

export function useNotificationBridge({ user, navigationRef }) {
  const pendingRef = useRef(null);
  const handledRef = useRef(new Set());
  const userRef = useRef(user);
  userRef.current = user;

  // Navega al destino pendiente cuando hay sesión y el navegador está listo.
  const flush = useCallback(() => {
    const tap = pendingRef.current;
    const currentUser = userRef.current;
    if (!tap || !currentUser || !navigationRef.isReady()) return;
    pendingRef.current = null;

    // Un recordatorio de otra cuenta no abre nada.
    if (tap.data.userId != null && tap.data.userId !== currentUser.id) return;

    if (tap.data.type === 'game' && tap.data.gameId) {
      navigationRef.navigate('GameDetail', { gameId: tap.data.gameId });
    } else if (tap.data.type === 'daily') {
      navigationRef.navigate('MainTabs', { screen: 'Catalogo' });
    }
  }, [navigationRef]);

  const handleTap = useCallback(
    (tap) => {
      if (!tap || handledRef.current.has(tap.key)) return;
      handledRef.current.add(tap.key);
      pendingRef.current = tap;
      flush();
    },
    [flush]
  );

  useEffect(() => {
    if (!NOTIFICATIONS_SUPPORTED) return undefined;
    getInitialNotificationTap().then(handleTap);
    return addNotificationTapListener(handleTap);
  }, [handleTap]);

  // Al cambiar la sesión: aplicar un toque pendiente y restaurar el recordatorio diario.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    flush();
    if (!NOTIFICATIONS_SUPPORTED) return;
    (async () => {
      try {
        const pref = await getDailyReminderPref(userId);
        if (!pref.enabled) return;
        const permission = await getNotificationPermission();
        if (!permission?.granted) return;
        await scheduleDailyReminder({ hour: pref.hour, minute: pref.minute, userId });
      } catch (err) {
        // Si falla, Perfil muestra el recordatorio como inactivo al consultarlo.
      }
    })();
  }, [userId, flush]);

  // Para el onReady del NavigationContainer.
  return { onNavigationReady: flush };
}

export default useNotificationBridge;
