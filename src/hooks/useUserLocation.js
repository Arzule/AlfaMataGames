// src/hooks/useUserLocation.js
// Ciudad del Perfil: pide el permiso de ubicación (con explicación previa), toma una
// posición aproximada y la envía redondeada a 2 decimales; el backend obtiene la ciudad.
import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { usePermission } from './usePermission';
import { useAuth } from './useAuth';
import { createLogger } from '../utils/logger';

const log = createLogger('ubicacion');

const round2 = (value) => Math.round(value * 100) / 100;

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
    const granted = await permission.ensure();
    if (!granted) return;
    setBusy('detect');
    try {
      const enabled = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!enabled) {
        setMessage({ type: 'error', text: 'Activa la ubicación del dispositivo e inténtalo de nuevo.' });
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      await saveLocation(round2(position.coords.latitude), round2(position.coords.longitude));
      setMessage({ type: 'success', text: 'Ciudad actualizada.' });
    } catch (err) {
      log.info('No se pudo obtener la ciudad', { error: err?.message });
      setMessage({ type: 'error', text: err?.message || 'No se pudo obtener tu ubicación.' });
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
