// src/components/SearchBar.js
// Caja de busqueda reutilizable. Sin logica de red.
import React from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = 'Buscar juegos...',
  style,
}) {
  return (
    <View style={[styles.box, style]}>
      <Feather name="search" size={16} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="Limpiar búsqueda"
        >
          <Feather name="x" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.body,
  },
});
