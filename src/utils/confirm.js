// src/utils/confirm.js
// Confirmación multiplataforma.
// En web, Alert.alert con botones no muestra las acciones en react-native-web,
// por eso se usa window.confirm. En nativo se usa Alert.alert con dos botones.
import { Alert, Platform } from 'react-native';

// Muestra un diálogo de confirmación y resuelve true si el usuario confirma.
export function confirmAction({ title, message, confirmText = 'Aceptar', cancelText = 'Cancelar' } = {}) {
  if (Platform.OS === 'web') {
    const text = [title, message].filter(Boolean).join('\n\n');
    const ok =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(text)
        : false;
    return Promise.resolve(ok);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
