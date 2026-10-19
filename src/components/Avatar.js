// src/components/Avatar.js
// Foto de perfil circular; si no hay foto, muestra las iniciales del nombre.
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

// "Ana María López" -> "AM"; nombre vacío -> "?".
function initialsOf(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Avatar({ uri, name, size = 40, style }) {
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.circle, dimensions, style]}>
      {uri ? (
        <Image source={{ uri }} style={dimensions} contentFit="cover" transition={150} />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.38) }]}>
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

Avatar.propTypes = {
  uri: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.badgeNeutral,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.primary,
    fontFamily: fonts.heading,
  },
});
