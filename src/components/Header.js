// src/components/Header.js
// Barra de encabezado reutilizable.
// title: texto principal; subtitle: linea pequena que aparece encima (ej. un saludo).
// left / right: elementos opcionales (avatar, botones, contadores, etc.).
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function Header({ title, subtitle, left, right, style }) {
  return (
    <View style={[styles.bar, style]}>
      <View style={styles.leftGroup}>
        {left ? <View style={styles.slot}>{left}</View> : null}
        <View style={styles.texts}>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.slot}>{right}</View> : null}
    </View>
  );
}

Header.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  left: PropTypes.node,
  right: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flexShrink: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fonts.heading,
  },
});
