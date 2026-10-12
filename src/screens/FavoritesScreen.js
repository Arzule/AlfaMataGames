// src/screens/FavoritesScreen.js
// Juegos marcados como favoritos por el usuario.
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import GameCard from '../components/GameCard';
import Header from '../components/Header';
import { useLibrary } from '../hooks/useLibrary';

export default function FavoritesScreen({ navigation }) {
  const { items, loading, error, refresh } = useLibrary();

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

  const renderItem = useCallback(
    ({ item }) => (
      <GameCard
        game={item}
        status={item.status}
        onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
      />
    ),
    [navigation]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <Header
        title="Favoritos"
        style={styles.header}
        right={
          <Text style={styles.count}>
            {favorites.length} {favorites.length === 1 ? 'juego' : 'juegos'}
          </Text>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>Aún no tienes favoritos</Text>
              <Text style={styles.emptyHelp}>
                Marca un juego con el corazón desde su detalle
              </Text>
            </View>
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
  header: {
    paddingTop: 60,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.heading,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyHelp: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});