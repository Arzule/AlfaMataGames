// src/components/Rating.js
// Estrellas de puntuación (0-5). Sin lógica de red.
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const STARS = [1, 2, 3, 4, 5];

export default function Rating({ value = null, onChange, size = 24, readOnly = false }) {
  const interactive = typeof onChange === 'function' && !readOnly;
  const current = typeof value === 'number' ? value : 0;

  // Tocar la misma estrella la deja sin puntuación (null).
  const handlePress = (star) => {
    if (!interactive) return;
    onChange(star === current ? null : star);
  };

  return (
    <View style={styles.row}>
      {STARS.map((star) => {
        const filled = star <= current;
        const icon = (
          <Feather
            name="star"
            size={size}
            color={filled ? colors.warning : colors.textMuted}
            fill={filled ? colors.warning : 'none'}
          />
        );

        if (!interactive) {
          return (
            <View key={star} style={styles.star}>
              {icon}
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={star}
            style={styles.star}
            activeOpacity={0.7}
            onPress={() => handlePress(star)}
          >
            {icon}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  star: {
    padding: 2,
  },
});
