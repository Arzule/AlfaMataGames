// src/components/LibraryStats.js
// Tarjeta de estadísticas de la biblioteca (Perfil): totales, favoritos, media y estados.
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { STATUS_STYLES } from './GameCard';
import { STATS_STATUSES } from '../utils/libraryStats';

function StatTile({ icon, value, label }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

StatTile.propTypes = {
  icon: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
};

export default function LibraryStats({ stats, loading = false }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Mi biblioteca</Text>
      {loading ? (
        <Text style={styles.hint}>Cargando estadísticas…</Text>
      ) : stats.total === 0 ? (
        <Text style={styles.hint}>
          Aún no tienes juegos guardados. Marca favoritos, estados o puntuaciones en el Catálogo.
        </Text>
      ) : (
        <>
          <View style={styles.tiles}>
            <StatTile icon="layers" value={stats.total} label="Juegos" />
            <StatTile icon="heart" value={stats.favorites} label="Favoritos" />
            <StatTile
              icon="star"
              value={stats.averageScore === null ? '—' : stats.averageScore.toFixed(1)}
              label={stats.scored ? `Media (${stats.scored})` : 'Media'}
            />
          </View>
          <View style={styles.statuses}>
            {STATS_STATUSES.map((status) => {
              const tone = STATUS_STYLES[status];
              return (
                <View
                  key={status}
                  style={[styles.statusChip, { backgroundColor: tone.bg }]}
                  accessible
                  accessibilityLabel={`${status}: ${stats.byStatus[status]}`}
                >
                  <Text style={[styles.statusCount, { color: tone.text }]}>
                    {stats.byStatus[status]}
                  </Text>
                  <Text style={[styles.statusLabel, { color: tone.text }]}>{status}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

LibraryStats.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    favorites: PropTypes.number.isRequired,
    scored: PropTypes.number.isRequired,
    averageScore: PropTypes.number,
    byStatus: PropTypes.objectOf(PropTypes.number).isRequired,
  }).isRequired,
  loading: PropTypes.bool,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  tiles: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fonts.headingExtraBold,
  },
  tileLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  statuses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusCount: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
  },
});
