// src/components/DateTimePickerModal.js
// Selector de fecha y/o hora del sistema.
// - Android: diálogos nativos (para 'datetime', primero la fecha y luego la hora).
// - iOS: rueda dentro de un modal con Cancelar / Aceptar.
// - Web: no se usa (los recordatorios no existen en web); no renderiza nada.
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

// Abre un diálogo nativo de Android y resuelve la fecha elegida o null si se cierra.
function openAndroidPicker({ mode, value, minimumDate }) {
  return new Promise((resolve) => {
    DateTimePickerAndroid.open({
      mode,
      value,
      minimumDate: mode === 'date' ? minimumDate : undefined,
      is24Hour: true,
      onValueChange: (event, date) => resolve(date ?? null),
      onDismiss: () => resolve(null),
    });
  });
}

export default function DateTimePickerModal({
  visible,
  mode = 'datetime',
  value,
  minimumDate,
  title,
  onConfirm,
  onCancel,
}) {
  const [draft, setDraft] = useState(value);
  // Referencias para no reabrir el diálogo de Android si cambian los callbacks.
  const callbacksRef = useRef({ onConfirm, onCancel });
  callbacksRef.current = { onConfirm, onCancel };

  useEffect(() => {
    if (visible) setDraft(value);
    // Solo al abrir: value puede cambiar mientras el modal está visible.
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    let cancelled = false;
    (async () => {
      let result = value;
      if (mode === 'date' || mode === 'datetime') {
        result = await openAndroidPicker({ mode: 'date', value: result, minimumDate });
      }
      if (result && (mode === 'time' || mode === 'datetime')) {
        const time = await openAndroidPicker({ mode: 'time', value: result });
        result = time
          ? new Date(
              result.getFullYear(),
              result.getMonth(),
              result.getDate(),
              time.getHours(),
              time.getMinutes()
            )
          : null;
      }
      if (cancelled) return;
      if (result) callbacksRef.current.onConfirm(result);
      else callbacksRef.current.onCancel();
    })();
    return () => {
      cancelled = true;
    };
    // Solo al abrir: el diálogo usa los valores de ese momento.
  }, [visible]);

  if (Platform.OS !== 'ios') return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <DateTimePicker
            value={draft ?? value}
            mode={mode}
            display="spinner"
            minimumDate={minimumDate}
            locale="es-ES"
            themeVariant="dark"
            textColor={colors.textPrimary}
            onValueChange={(event, date) => setDraft(date)}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => onConfirm(draft ?? value)}
            >
              <Text style={styles.confirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

DateTimePickerModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['date', 'time', 'datetime']),
  value: PropTypes.instanceOf(Date).isRequired,
  minimumDate: PropTypes.instanceOf(Date),
  title: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.heading,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  confirmText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
