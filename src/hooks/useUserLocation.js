// src/hooks/useUserLocation.js
// Ciudad del Perfil: pide el permiso de ubicación (con explicación previa), toma una
// posición aproximada y la envía redondeada a 2 decimales; el backend obtiene la ciudad.
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { usePermission } from './usePermission';
import { useAuth } from './useAuth';
import { createLogger } from '../utils/logger';

const log = createLogger('ubicacion');

const round2 = (value) => Math.round(value * 100) / 100;

const TIMEOUT_MS = 15000;

const NO_PERMISSION =
  Platform.OS === 'web'
    ? 'El navegador no entregó tu ubicación. Revisa el permiso del sitio (icono junto a la ' +
      'dirección) y que la ubicación de Windows esté activada.'
    : 'Sin permiso de ubicación no se puede obtener tu ciudad.';

// Códigos de GeolocationPositionError (web) y errores de expo-location (nativo) en español.
function positionErrorText(err) {
  if (err?.code === 1) return NO_PERMISSION;
  if (err?.code === 2 || err?.code === 'E_LOCATION_UNAVAILABLE') {
    return 'No se pudo determinar tu ubicación. Revisa que la ubicación del dispositivo esté activada.';
  }
  if (err?.code === 3 || err?.code === 'TIMEOUT') {
    return 'La ubicación tardó demasiado. Inténtalo de nuevo.';
  }
  return null;
}

// getCurrentPositionAsync puede quedarse esperando sin responder: se corta a los 15 s.
function currentPosition() {
  return Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low, timeout: TIMEOUT_MS }),
    new Promise((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })), TIMEOUT_MS)
    ),
  ]);
}

export function useUserLocation() {
  const { saveLocation, removeLocation } = useAuth();
  const [busy, setBusy] = useState(null); // 'detect' | 'remove' | null
  const [message, setMessage] = useState(null);

  const permission = usePermission({
    getPermission: Location.getForegroundPermissionsAsync,
    requestPermission: Location.requestForegroundPermissionsAsync,
    title: 'Ubicación',
    rationale:
      'AlfaMataGames usa tu ubicación una sola vez para mostrar tu ciudad en el Perfil. ' +
      'Solo se guardan la ciudad y el país, nunca tu posición.',
  });

  const detect = useCallback(async () => {
    setMessage(null);
    // En web el navegador muestra su propio diálogo y el error dice el motivo (permiso o sin
    // ubicación); expo-location lo confunde con "sin permiso", por eso ahí se pide directo.
    if (Platform.OS !== 'web') {
      const granted = await permission.ensure();
      if (!granted) {
        const status = await permission.refresh();
        if (status === 'denied' || status === 'blocked') {
          setMessage({ type: 'error', text: NO_PERMISSION });
        }
        return;
      }
    }
    setBusy('detect');
    try {
      const enabled =
        Platform.OS === 'web' || (await Location.hasServicesEnabledAsync().catch(() => true));
      if (!enabled) {
        setMessage({ type: 'error', text: 'Activa la ubicación del dispositivo e inténtalo de nuevo.' });
        return;
      }
      const position = await currentPosition();
      await saveLocation(round2(position.coords.latitude), round2(position.coords.longitude));
      setMessage({ type: 'success', text: 'Ciudad actualizada.' });
    } catch (err) {
      log.info('No se pudo obtener la ciudad', { error: err?.message, code: err?.code });
      setMessage({
        type: 'error',
        text: positionErrorText(err) || err?.message || 'No se pudo obtener tu ubicación.',
      });
    } finally {
      setBusy(null);
    }
  }, [permission, saveLocation]);

  const remove = useCallback(async () => {
    setMessage(null);
    setBusy('remove');
    try {
      await removeLocation();
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'No se pudo quitar la ciudad.' });
    } finally {
      setBusy(null);
    }
  }, [removeLocation]);

  return { busy, message, detect, remove, permissionStatus: permission.status };
}

export default useUserLocation;
