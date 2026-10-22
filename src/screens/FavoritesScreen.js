// src/screens/FavoritesScreen.js
// Juegos marcados como favoritos por el usuario.
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import GameCard from '../components/GameCard';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useLibrary } from '../hooks/useLibrary';
import { useGridColumns, GRID_PERFORMANCE_PROPS } from '../hooks/useGridColumns';

export default function FavoritesScreen({ navigation }) {
  const { items, loading, error, refresh } = useLibrary();

  // Columnas segun el ancho de pantalla (2 movil, 3 tablet, 4 a 6 escritorio).
  const columns = useGridColumns();

  // Solo las entradas favoritas, en formato de GameCard.
  const favorites = useMemo(
    () =>
      items
        .filter((item) => item.isFavorite)
        .map((item) => ({
          id: item.gameId,
          title: item.name,
          image: item.image,
          rating: item.rating != null ? Number(item.rating).toFixed(1) : null,
          status: item.status,
        })),
    [items]
  );

  const handleOpenGame = useCallback(
    (game) => navigation.navigate('GameDetail', { gameId: game.id }),
    [navigation]
  );

  const cellStyle = useMemo(() => [styles.cell, { maxWidth: `${100 / columns}%` }], [columns]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={cellStyle}>
        <GameCard game={item} status={item.status} onPress={handleOpenGame} />
      </View>
    ),
    [cellStyle, handleOpenGame]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <Header
        title="Favoritos"
        right={
          <Text style={styles.count}>
            {favorites.length} {favorites.length === 1 ? 'juego' : 'juegos'}
          </Text>
        }
      />

      {loading && !items.length ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error && !items.length ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={favorites}
          key={`favoritos-${columns}`}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          {...GRID_PERFORMANCE_PROPS}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            error ? <Text style={styles.inlineError}>{error}</Text> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="heart"
              title="Aún no tienes favoritos"
              message="Marca un juego con el corazón desde su detalle"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  gridContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
    flexGrow: 1,
  },
  row: {
    gap: 16,
  },
  cell: {
    flex: 1,
  },
  inlineError: {
    color: colors.warning,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
});