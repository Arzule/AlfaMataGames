// src/hooks/usePermission.js
// Gestión reutilizable de un permiso del sistema (cámara, notificaciones...).
// Estados: 'undetermined' | 'granted' | 'denied' | 'blocked' | 'unavailable'.
// - Antes de pedirlo, explica al usuario para qué se usa.
// - Si está bloqueado (no se puede volver a preguntar), ofrece "Abrir ajustes".
// - Se vuelve a leer al regresar a la app (por si se cambió en ajustes).
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { confirmAction } from '../utils/confirm';

// Convierte la respuesta de Expo ({ granted, status, canAskAgain }) a un estado propio.
function toStatus(response) {
  if (!response) return 'unavailable';
  if (response.granted) return 'granted';
  if (response.canAskAgain === false) return 'blocked';
  return response.status === 'undetermined' ? 'undetermined' : 'denied';
}

/**
 * @param {Object} options
 * @param {() => Promise<Object>} options.getPermission  lee el permiso sin pedirlo
 * @param {() => Promise<Object>} options.requestPermission  muestra el diálogo del sistema
 * @param {string} options.title  título de la explicación previa
 * @param {string} options.rationale  para qué se usa el permiso
 */
export function usePermission({ getPermission, requestPermission, title, rationale }) {
  const [status, setStatus] = useState('undetermined');

  const refresh = useCallback(async () => {
    try {
      const next = toStatus(await getPermission());
      setStatus(next);
      return next;
    } catch (err) {
      setStatus('unavailable');
      return 'unavailable';
    }
  }, [getPermission]);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  // Devuelve true si el permiso queda concedido.
  const ensure = useCallback(async () => {
    const current = await refresh();
    if (current === 'granted') return true;
    if (current === 'unavailable') return false;

    if (current === 'blocked') {
      const goToSettings = await confirmAction({
        title: 'Permiso bloqueado',
        message: `${rationale}\n\nEl permiso está desactivado. Actívalo en los ajustes del sistema.`,
        confirmText: 'Abrir ajustes',
        cancelText: 'Ahora no',
        icon: 'lock',
      });
      if (goToSettings) openSettings();
      return false;
    }

    // Explicación previa antes del diálogo del sistema.
    const accepted = await confirmAction({
      title,
      message: rationale,
      confirmText: 'Continuar',
      cancelText: 'Ahora no',
      icon: 'shield',
    });
    if (!accepted) return false;

    try {
      const next = toStatus(await requestPermission());
      setStatus(next);
      return next === 'granted';
    } catch (err) {
      setStatus('unavailable');
      return false;
    }
  }, [refresh, requestPermission, rationale, title, openSettings]);

  return { status, ensure, refresh, openSettings };
}

export default usePermission;
