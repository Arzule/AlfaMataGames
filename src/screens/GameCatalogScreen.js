// src/screens/GameCatalogScreen.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import GameCard from '../components/GameCard';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryButton from '../components/CategoryButton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';
import { useDebounce } from '../hooks/useDebounce';
import { useGames } from '../hooks/useGames';
import { useGridColumns } from '../hooks/useGridColumns';

const CATEGORIES = ['Todos', 'Jugando', 'Completado', 'Pendiente', 'Abandonado'];

export default function GameCatalogScreen({ navigation }) {
  const { user } = useAuth();
  const { items, getEntry, loading: libraryLoading } = useLibrary();
  const username = user?.name ?? 'jugador';

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Búsqueda con debounce; el término efectivo se aplica sola o al enviar.
  const debouncedSearch = useDebounce(searchText, 500);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch]);

  const { games, loading, loadingMore, error, hasMore, loadMore, reload } = useGames({
    search: searchTerm,
  });

  // Columnas segun el ancho de pantalla (2 movil, 3 tablet, 4 escritorio).
  const columns = useGridColumns();

  const isTodos = selectedCategory === 'Todos';

  // Juegos de la biblioteca con el estado elegido, filtrados por nombre.
  const libraryGames = useMemo(
    () =>
      items
        .filter((item) => item.status === selectedCategory)
        .filter((item) => {
          const query = debouncedSearch.trim().toLowerCase();
          if (!query) return true;
          return (item.name ?? '').toLowerCase().includes(query);
        })
        .map((item) => ({
          id: item.gameId,
          title: item.name,
          image: item.image,
          rating: item.rating != null ? Number(item.rating).toFixed(1) : null,
          status: item.status,
          platform: null,
        })),
    [items, selectedCategory, debouncedSearch]
  );

  const data = isTodos ? games : libraryGames;
  const isLoading = isTodos ? loading : libraryLoading;

  const emptyMessage = isTodos
    ? 'No se encontraron juegos.'
    : `Aún no tienes juegos en «${selectedCategory}».`;

  const handleSearchSubmit = () => setSearchTerm(searchText);

  const renderItem = useCallback(
    ({ item }) => {
      const status = isTodos ? getEntry(item.id)?.status ?? null : item.status;
      return (
        <View style={[styles.cell, { maxWidth: `${100 / columns}%` }]}>
          <GameCard
            game={item}
            status={status}
            platform={item.platform}
            onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
          />
        </View>
      );
    },
    [isTodos, getEntry, navigation, columns]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  // Paginación solo en el chip "Todos".
  const handleEndReached = useCallback(() => {
    if (isTodos) loadMore();
  }, [isTodos, loadMore]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header
        subtitle="Hola,"
        title={username}
        left={
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={18} color={colors.textSecondary} />
          </View>
        }
        right={
          <TouchableOpacity style={styles.notifBtn}>
            <Feather name="bell" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          onSubmit={handleSearchSubmit}
          placeholder="Buscar juegos..."
        />
      </View>

      {/* Categorías */}
      <View style={styles.categoryScroller}>
        {CATEGORIES.map((category) => (
          <CategoryButton
            key={category}
            label={category}
            active={category === selectedCategory}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </View>

      {/* Contenido */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isTodos && error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={data}
          key={`catalogo-${columns}`}
          keyExtractor={keyExtractor}
          numColumns={columns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isTodos && loadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                size="small"
                style={styles.footerSpinner}
              />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={isTodos ? 'search' : 'inbox'}
              title={emptyMessage}
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  categoryScroller: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  footerSpinner: {
    paddingVertical: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
});