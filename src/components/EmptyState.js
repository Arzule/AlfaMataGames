// src/components/EmptyState.js
// Mensaje centrado para listas o pantallas sin contenido.
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function EmptyState({ icon = 'inbox', title, message }) {
  return (
    <View style={styles.centered}>
      {icon ? (
        <Feather name={icon} size={32} color={colors.textMuted} style={styles.icon} />
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.heading,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});