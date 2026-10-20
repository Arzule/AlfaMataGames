// src/hooks/useNetworkStatus.js
// Estado de la red con NetInfo: { isOffline }.
// Sin red = sin conexión o, en nativo, conectado pero sin acceso a internet
// (isInternetReachable null significa "todavía no se sabe" y no cuenta como sin red).
// En web solo se usa isConnected (navigator.onLine): la comprobación de internet de
// NetInfo hace peticiones a otro dominio y puede dar falsos negativos.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { createLogger } from '../utils/logger';

const log = createLogger('red');

export function isOfflineState(state) {
  if (!state) return false;
  if (state.isConnected === false) return true;
  return Platform.OS !== 'web' && state.isInternetReachable === false;
}

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // addEventListener entrega el estado actual de inmediato y luego cada cambio.
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = isOfflineState(state);
      setIsOffline((previous) => {
        if (previous !== offline) {
          log.info(offline ? 'Sin conexión' : 'Conexión restablecida', { type: state.type });
        }
        return offline;
      });
    });
    return unsubscribe;
  }, []);

  return { isOffline };
}

export default useNetworkStatus;
