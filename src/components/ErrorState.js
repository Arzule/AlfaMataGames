// src/components/ErrorState.js
// Mensaje de error centrado, con boton opcional para reintentar.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

export default function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.centered}>
      <Feather
        name="alert-triangle"
        size={30}
        color={colors.warning}
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry}>
          <Text style={styles.retry}>Reintentar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

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
  message: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: 12,
  },
  retry: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
});