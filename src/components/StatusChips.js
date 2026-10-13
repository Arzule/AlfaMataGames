// src/components/StatusChips.js
// Selector del estado de un juego. Sin lógica de red.
// Reutiliza los colores de los badges de GameCard.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { STATUS_STYLES } from './GameCard';
import { fonts } from '../theme/typography';

const STATUSES = ['Jugando', 'Completado', 'Pendiente', 'Abandonado'];

export default function StatusChips({ value = null, onChange }) {
  const interactive = typeof onChange === 'function';

  // Tocar el estado seleccionado lo deselecciona (null).
  const handlePress = (status) => {
    if (!interactive) return;
    onChange(status === value ? null : status);
  };

  return (
    <View style={styles.row}>
      {STATUSES.map((status) => {
        const active = status === value;
        const statusStyle = STATUS_STYLES[status];
        return (
          <TouchableOpacity
            key={status}
            activeOpacity={0.7}
            disabled={!interactive}
            onPress={() => handlePress(status)}
            style={[
              styles.chip,
              { backgroundColor: statusStyle.bg, borderColor: statusStyle.text },
              active && styles.chipActive,
            ]}
          >
            <Text style={[styles.chipText, { color: statusStyle.text }]}>
              {status}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    opacity: 0.6,
  },
  chipActive: {
    borderWidth: 2,
    opacity: 1,
  },
  chipText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
});
