// src/components/ConfirmDialog.js
// Diálogo de confirmación con el estilo de la app (reemplaza Alert.alert y window.confirm).
// ConfirmDialogHost se monta una vez en App.js y atiende las llamadas a confirmAction
// (src/utils/confirm.js) en orden, una a la vez.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, View, Text, TouchableOpacity, Pressable, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { setConfirmHost } from '../utils/confirm';

// Respaldo por si onDismiss no llega en iOS (la animación de salida dura ~300 ms).
const IOS_DISMISS_FALLBACK_MS = 500;

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  destructive = false,
  icon,
  onConfirm,
  onCancel,
  onDismiss,
}) {
  const accent = destructive ? colors.danger : colors.primary;
  const iconName = icon ?? (destructive ? 'alert-triangle' : 'help-circle');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
      onDismiss={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={cancelText}>
        {/* Pressable interno para que tocar la tarjeta no cierre el diálogo. */}
        <Pressable style={styles.card} onPress={() => {}} accessibilityViewIsModal>
          <View style={[styles.iconCircle, { backgroundColor: destructive ? colors.dangerBg : colors.primaryBg }]}>
            <Feather name={iconName} size={22} color={accent} />
          </View>
          {title ? (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accent }]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  destructive: PropTypes.bool,
  icon: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDismiss: PropTypes.func,
};

// Atiende confirmAction: cola de solicitudes { options, resolve }, muestra la primera.
export function ConfirmDialogHost() {
  const [queue, setQueue] = useState([]);
  const [visible, setVisible] = useState(false);
  // Opciones mostradas: se conservan durante la animación de salida.
  const [shown, setShown] = useState(null);
  const closingRef = useRef(false);
  const pendingRef = useRef(null);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  useEffect(() => {
    const unregister = setConfirmHost(
      (options) => new Promise((resolve) => setQueue((items) => [...items, { options, resolve }]))
    );
    return () => {
      unregister();
      // Si el host se desmonta con diálogos pendientes, se dan por cancelados.
      queueRef.current.forEach((item) => item.resolve(false));
    };
  }, []);

  const current = queue[0];

  useEffect(() => {
    if (current && !closingRef.current) {
      setShown(current.options);
      setVisible(true);
    }
  }, [current]);

  const runPending = useCallback(() => {
    const done = pendingRef.current;
    pendingRef.current = null;
    if (done) done();
  }, []);

  const close = useCallback(
    (result) => {
      if (!current || closingRef.current) return;
      closingRef.current = true;
      setVisible(false);
      const done = () => {
        closingRef.current = false;
        current.resolve(result);
        setQueue((items) => items.slice(1));
      };
      // En iOS se resuelve al terminar de cerrarse: abrir otro modal del sistema (cámara,
      // selector) mientras este se cierra puede fallar en silencio.
      if (Platform.OS === 'ios') {
        pendingRef.current = done;
        setTimeout(runPending, IOS_DISMISS_FALLBACK_MS);
      } else {
        done();
      }
    },
    [current, runPending]
  );

  const handleConfirm = useCallback(() => close(true), [close]);
  const handleCancel = useCallback(() => close(false), [close]);

  if (!shown) return null;
  return (
    <ConfirmDialog
      visible={visible}
      title={shown.title}
      message={shown.message}
      confirmText={shown.confirmText}
      cancelText={shown.cancelText}
      destructive={shown.destructive}
      icon={shown.icon}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onDismiss={runPending}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 19,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: colors.badgeNeutral,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    textAlign: 'center',
  },
  confirmText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    textAlign: 'center',
  },
});
