// src/hooks/useAvatarPicker.js
// Flujo de la foto de perfil: cámara o galería -> recorte/reducción -> subida al backend.
// Todos los fallos terminan en un mensaje visible (feedback), nunca en un cierre.
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from './useAuth';
import { usePermission } from './usePermission';
import { prepareAvatar } from '../utils/avatarImage';
import { confirmAction } from '../utils/confirm';

// Opciones comunes: solo imágenes, recorte cuadrado del sistema (Android/iOS).
const PICKER_OPTIONS = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

// En web la cámara del navegador no se usa: se oculta la opción.
export const CAMERA_SUPPORTED = Platform.OS !== 'web';

export function useAvatarPicker() {
  const { updateAvatar, removeAvatar } = useAuth();
  const [busy, setBusy] = useState(false);
  // { type: 'success' | 'info' | 'error', text }
  const [feedback, setFeedback] = useState(null);

  const camera = usePermission({
    getPermission: ImagePicker.getCameraPermissionsAsync,
    requestPermission: ImagePicker.requestCameraPermissionsAsync,
    title: 'Acceso a la cámara',
    rationale: 'AlfaMataGames usa la cámara solo para tomar tu foto de perfil.',
  });

  // Procesa y sube la imagen elegida.
  const upload = useCallback(
    async (result) => {
      if (!result || result.canceled || !result.assets?.length) {
        setFeedback({ type: 'info', text: 'No se seleccionó ninguna foto.' });
        return;
      }
      setBusy(true);
      try {
        let image;
        try {
          image = await prepareAvatar(result.assets[0]);
        } catch (err) {
          setFeedback({ type: 'error', text: 'No se pudo procesar la imagen. Prueba con otra.' });
          return;
        }
        await updateAvatar(image);
        setFeedback({ type: 'success', text: 'Foto de perfil actualizada.' });
      } catch (err) {
        setFeedback({ type: 'error', text: err.message || 'No se pudo guardar la foto.' });
      } finally {
        setBusy(false);
      }
    },
    [updateAvatar]
  );

  const takePhoto = useCallback(async () => {
    setFeedback(null);
    const granted = await camera.ensure();
    if (!granted) {
      setFeedback({ type: 'error', text: 'Sin permiso de cámara no se puede tomar la foto.' });
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    } catch (err) {
      setFeedback({ type: 'error', text: 'La cámara no está disponible en este dispositivo.' });
      return;
    }
    await upload(result);
  }, [camera, upload]);

  // La galería usa el selector del sistema: no requiere permiso.
  const pickPhoto = useCallback(async () => {
    setFeedback(null);
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    } catch (err) {
      setFeedback({ type: 'error', text: 'No se pudo abrir la galería.' });
      return;
    }
    await upload(result);
  }, [upload]);

  const deletePhoto = useCallback(async () => {
    setFeedback(null);
    const confirmed = await confirmAction({
      title: 'Eliminar foto',
      message: '¿Quieres quitar tu foto de perfil?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    setBusy(true);
    try {
      await removeAvatar();
      setFeedback({ type: 'success', text: 'Foto de perfil eliminada.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo eliminar la foto.' });
    } finally {
      setBusy(false);
    }
  }, [removeAvatar]);

  return {
    busy,
    feedback,
    cameraStatus: camera.status,
    openSettings: camera.openSettings,
    takePhoto,
    pickPhoto,
    deletePhoto,
  };
}

export default useAvatarPicker;
