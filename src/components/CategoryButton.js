// src/components/CategoryButton.js
// Chip de categoria / filtro. Sin logica de red.
import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function CategoryButton({ label, active = false, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

CategoryButton.propTypes = {
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onPress: PropTypes.func,
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
  },
});
