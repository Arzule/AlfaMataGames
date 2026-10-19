// src/components/GameCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

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
      {/* expo-image guarda la portada en caché de disco (cachePolicy por defecto: disk). */}
      <Image
        source={game.image ? { uri: game.image } : null}
        style={styles.cover}
        contentFit="cover"
        transition={200}
      />
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

GameCard.propTypes = {
  game: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string,
    image: PropTypes.string,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onPress: PropTypes.func,
  status: PropTypes.oneOf(Object.keys(STATUS_STYLES)),
  platform: PropTypes.string,
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.badgeNeutral,
  },
  details: {
    padding: 12,
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
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
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodyBold,
  },
});
