// src/components/RecentSearches.js
// Lista de búsquedas recientes bajo la barra de búsqueda. Sin lógica de red.
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function RecentSearches({ items, onSelect, onRemove, onClear }) {
  if (!items.length) return null;

  return (
    <View style={styles.box}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Búsquedas recientes</Text>
        {onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={8}>
            <Text style={styles.clear}>Borrar todo</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {items.map((term) => (
        <View key={term} style={styles.row}>
          <TouchableOpacity style={styles.term} onPress={() => onSelect(term)}>
            <Feather name="clock" size={14} color={colors.textMuted} />
            <Text style={styles.termText} numberOfLines={1}>
              {term}
            </Text>
          </TouchableOpacity>
          {onRemove ? (
            <TouchableOpacity
              onPress={() => onRemove(term)}
              hitSlop={8}
              accessibilityLabel={`Quitar ${term} de recientes`}
            >
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

RecentSearches.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func,
  onClear: PropTypes.func,
};

const styles = StyleSheet.create({
  box: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  heading: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
  },
  clear: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  term: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  termText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.body,
  },
});
