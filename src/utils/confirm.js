// src/utils/confirm.js
// Confirmación multiplataforma.
// Se muestra con ConfirmDialog (estilo de la app), que registra ConfirmDialogHost desde
// App.js. Si el host no está montado se usa el diálogo del sistema: en web, Alert.alert con
// botones no muestra las acciones en react-native-web, por eso ahí va window.confirm.
import { Alert, Platform } from 'react-native';

let host = null;

// Lo llama ConfirmDialogHost al montarse; devuelve la función para quitar el registro.
export function setConfirmHost(showDialog) {
  host = showDialog;
  return () => {
    if (host === showDialog) host = null;
  };
}

function systemConfirm({ title, message, confirmText, cancelText }) {
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

// Muestra un diálogo de confirmación y resuelve true si el usuario confirma.
// destructive: botón rojo (borrar, cerrar sesión...); icon: nombre de Feather opcional.
export function confirmAction({
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  destructive = false,
  icon,
} = {}) {
  const options = { title, message, confirmText, cancelText, destructive, icon };
  return host ? host(options) : systemConfirm(options);
}
