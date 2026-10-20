// src/hooks/useNotificationPermission.js
// Permiso de notificaciones con el flujo común de usePermission.
import { usePermission } from './usePermission';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../services/notifications';

export function useNotificationPermission() {
  return usePermission({
    getPermission: getNotificationPermission,
    requestPermission: requestNotificationPermission,
    title: 'Notificaciones',
    rationale:
      'AlfaMataGames usa las notificaciones solo para los recordatorios que tú programes.',
  });
}

export default useNotificationPermission;
