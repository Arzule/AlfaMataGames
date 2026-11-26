// src/components/LocationCard.js
// Tarjeta "Mi ciudad" del Perfil: detectar la ciudad con la ubicación y quitarla.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { useAuth } from '../hooks/useAuth';
import { useUserLocation } from '../hooks/useUserLocation';

export default function LocationCard() {
  const { user } = useAuth();
  const { busy, message, detect, remove, permissionStatus } = useUserLocation();
  const location = user?.location;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Feather name="map-pin" size={16} color={colors.textPrimary} />
        <Text style={styles.title}>Mi ciudad</Text>
      </View>

      {location ? (
        <Text style={styles.city}>
          {location.country ? `${location.city}, ${location.country}` : location.city}
        </Text>
      ) : (
        <Text style={styles.hint}>
          Muestra tu ciudad en el Perfil. Se usa tu ubicación una sola vez y solo se guarda la
          ciudad y el país, nunca tu posición.
        </Text>
      )}

      {permissionStatus === 'unavailable' ? (
        <Text style={styles.hint}>La ubicación no está disponible en este dispositivo.</Text>
      ) : (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={detect}
          disabled={Boolean(busy)}
          accessibilityRole="button"
        >
          {busy === 'detect' ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.primaryBtnText}>
              {location ? 'Actualizar ciudad' : 'Usar mi ubicación'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {location ? (
        <TouchableOpacity
          onPress={remove}
          disabled={Boolean(busy)}
          accessibilityRole="button"
          style={styles.linkBtn}
        >
          <Text style={styles.danger}>{busy === 'remove' ? 'Quitando…' : 'Quitar ciudad'}</Text>
        </TouchableOpacity>
      ) : null}

      {message ? (
        <Text style={[styles.hint, message.type === 'error' ? styles.dangerText : styles.success]}>
          {message.text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bodySemiBold },
  city: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.heading },
  hint: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.body },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bodySemiBold },
  linkBtn: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
  danger: { color: colors.danger, fontSize: 12, fontFamily: fonts.bodyBold },
  dangerText: { color: colors.danger },
  success: { color: colors.success },
});
