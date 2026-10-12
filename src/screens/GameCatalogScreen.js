// src/screens/GameCatalogScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import GameCard from '../components/GameCard';
import { getGames } from '../services/rawgApi';
import { useAuth } from '../hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';

const CATEGORIES = ['Todos', 'Jugando', 'Completado', 'Pendiente', 'Abandonado'];

function mapRawgGame(game) {
  return {
    id: game.id,
    title: game.name,
    image: game.background_image,
    platform: game.platforms?.[0]?.platform?.name ?? null,
    rating: typeof game.rating === 'number' ? game.rating.toFixed(1) : null,
  };
}

export default function GameCatalogScreen({ navigation }) {
  const { user } = useAuth();
  const { items, getEntry, loading: libraryLoading } = useLibrary();
  const username = user?.name ?? 'jugador';

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const loadGames = useCallback(async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const results = await getGames({ search: query, pageSize: 20 });
      setGames(results.map(mapRawgGame));
    } catch (err) {
      setError('No se pudieron cargar los juegos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleSearchSubmit = () => {
    loadGames(searchText);
  };

  // Juegos de la biblioteca del usuario con el estado seleccionado,
  // filtrando por nombre localmente con el texto de búsqueda.
  const libraryGames = items
    .filter((item) => item.status === selectedCategory)
    .filter((item) => {
      const query = searchText.trim().toLowerCase();
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
    }));

  const isTodos = selectedCategory === 'Todos';
  const data = isTodos ? games : libraryGames;
  const isLoading = isTodos ? loading : libraryLoading;

  const emptyMessage = isTodos
    ? 'No se encontraron juegos.'
    : `Aún no tienes juegos en «${selectedCategory}».`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.userProfile}>
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={18} color={colors.textSecondary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.username} numberOfLines={1}>
              {username}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Feather name="bell" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar juegos..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Categorías */}
      <View style={styles.categoryScroller}>
        {CATEGORIES.map((category) => {
          const isActive = category === selectedCategory;
          return (
            <TouchableOpacity
              key={category}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenido */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isTodos && error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadGames(searchText)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => {
            const status = isTodos ? getEntry(item.id)?.status ?? null : item.status;
            return (
              <GameCard
                game={item}
                status={status}
                platform={item.platform}
                onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  userInfo: {
    flexShrink: 1,
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
  greeting: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  username: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  categoryScroller: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.textPrimary,
  },
  gridContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
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
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
