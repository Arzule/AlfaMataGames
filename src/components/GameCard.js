// src/components/GameCard.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Colores de los estados, compartidos con StatusChips.
export const STATUS_STYLES = {
  Completado: { bg: colors.successBg, text: colors.success },
  Jugando: { bg: colors.infoBg, text: colors.info },
  Pendiente: { bg: colors.warningBg, text: colors.warning },
  Abandonado: { bg: colors.badgeNeutral, text: colors.textSecondary },
};

export default function GameCard({ game, onPress, status = null, platform }) {
  const statusStyle = status ? STATUS_STYLES[status] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: game.image }} style={styles.cover} resizeMode="cover" />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {game.title}
        </Text>

        <View style={styles.metaRow}>
          {platform ? (
            <View style={styles.platformBlock}>
              <Feather name="monitor" size={13} color={colors.textSecondary} />
              <Text style={styles.platformText} numberOfLines={1}>
                {platform}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {game.rating != null ? (
            <View style={styles.ratingBlock}>
              <Feather name="star" size={12} color={colors.warning} />
              <Text style={styles.ratingText}>{game.rating}</Text>
            </View>
          ) : null}
        </View>

        {statusStyle ? (
          <View style={styles.badgeWrapper}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {status}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 200,
  },
  details: {
    padding: 12,
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  platformText: {
    color: colors.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },
  ratingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeWrapper: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
