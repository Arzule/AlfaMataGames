// src/components/ReminderSheet.js
// Hoja inferior con las opciones de "Recordarme jugar esto".
import React from 'react';
import PropTypes from 'prop-types';
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function ReminderSheet({ visible, title, options, onSelect, onPickCustom, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar">
        {/* Pressable interno para que tocar la hoja no la cierre. */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={styles.option}
              onPress={() => onSelect(option.key)}
            >
              <Feather name="clock" size={16} color={colors.textSecondary} />
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.option} onPress={onPickCustom}>
            <Feather name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.optionText}>Elegir fecha y hora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

ReminderSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ key: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onPickCustom: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.heading,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  cancel: {
    marginTop: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
});
