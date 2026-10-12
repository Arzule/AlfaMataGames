// src/screens/GameDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { getGameDetail } from '../services/rawgApi';
import { useLibrary } from '../hooks/useLibrary';
import Rating from '../components/Rating';
import StatusChips from '../components/StatusChips';

export default function GameDetailScreen({ route, navigation }) {
  const { gameId } = route.params;

  const { getEntry, isFavorite, saveEntry, loading: libraryLoading } = useLibrary();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const entry = getEntry(gameId);
  const favorite = isFavorite(gameId);
  const savedReview = entry?.review ?? '';

  const [reviewText, setReviewText] = useState(savedReview);
  useEffect(() => {
    setReviewText(savedReview);
  }, [savedReview]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getGameDetail(gameId);
        if (isMounted) setGame(data);
      } catch (err) {
        if (isMounted) setError('No se pudo cargar el detalle del juego.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Juego no encontrado.'}</Text>
      </View>
    );
  }

  const developer = game.developers?.[0]?.name ?? 'Desarrollador desconocido';
  const platforms = game.platforms?.map((p) => p.platform.name).join(', ') ?? 'N/D';
  const year = game.released ? new Date(game.released).getFullYear() : '—';

  // Resumen que se guarda la primera vez que el juego entra a la biblioteca.
  const summary = {
    id: game.id,
    name: game.name,
    image: game.background_image ?? null,
    rating: typeof game.rating === 'number' ? game.rating : null,
  };

  const busy = saving !== null;
  const canEdit = !libraryLoading && !busy;

  const runSave = async (tag, patch) => {
    setSaving(tag);
    setSaveError(null);
    try {
      await saveEntry(summary, patch);
    } catch (err) {
      setSaveError('No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleFavorite = () => runSave('favorite', { isFavorite: !favorite });
  const handleStatusChange = (status) => runSave('status', { status });
  const handleScoreChange = (userScore) => runSave('score', { userScore });
  const handleSaveReview = () =>
    runSave('review', { review: reviewText.trim() ? reviewText.trim() : null });

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.heroBlock}>
          <Image
            source={{ uri: game.background_image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaSection}>
          <View style={styles.tagsRow}>
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{year}</Text>
            </View>
          </View>

          <Text style={styles.title}>{game.name}</Text>
          <Text style={styles.developer}>{developer}</Text>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>VALORACIÓN</Text>
            <View style={styles.starsRow}>
              <Feather name="star" size={16} color={colors.warning} />
              <Text style={styles.ratingValue}>{game.rating?.toFixed(1) ?? '0.0'}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Feather name="monitor" size={14} color={colors.textSecondary} />
              <Text style={styles.statLabel}>PLATAFORMAS</Text>
              <Text style={styles.statValue} numberOfLines={2}>
                {platforms}
              </Text>
            </View>
          </View>

          <View style={styles.synopsisBlock}>
            <Text style={styles.sectionTitle}>SINOPSIS</Text>
            <Text style={styles.synopsisText} numberOfLines={6}>
              {game.description_raw ?? 'Sin descripción disponible.'}
            </Text>
          </View>

          {/* Mi biblioteca */}
          <View style={styles.libraryBlock}>
            <Text style={styles.sectionTitle}>MI BIBLIOTECA</Text>

            <View style={styles.libraryRow}>
              <Text style={styles.fieldLabel}>Estado</Text>
              <StatusChips
                value={entry?.status ?? null}
                onChange={canEdit ? handleStatusChange : undefined}
              />
            </View>

            <View style={styles.libraryRow}>
              <Text style={styles.fieldLabel}>Tu puntuación</Text>
              <Rating
                value={entry?.userScore ?? null}
                onChange={canEdit ? handleScoreChange : undefined}
                readOnly={!canEdit}
              />
            </View>

            <View style={styles.libraryRow}>
              <Text style={styles.fieldLabel}>Tu reseña</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Escribe tu reseña..."
                placeholderTextColor={colors.textMuted}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                maxLength={500}
                editable={!libraryLoading}
              />
              <TouchableOpacity
                style={[styles.reviewBtn, (libraryLoading || busy) && styles.btnDisabled]}
                onPress={handleSaveReview}
                disabled={libraryLoading || busy}
              >
                {saving === 'review' ? (
                  <ActivityIndicator color={colors.textPrimary} size="small" />
                ) : (
                  <Text style={styles.reviewBtnText}>Guardar reseña</Text>
                )}
              </TouchableOpacity>
            </View>

            {libraryLoading ? (
              <Text style={styles.hintText}>Cargando tu biblioteca...</Text>
            ) : null}
            {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.favoriteBtn, (libraryLoading || busy) && styles.btnDisabled]}
          onPress={handleToggleFavorite}
          disabled={libraryLoading || busy}
        >
          {saving === 'favorite' ? (
            <ActivityIndicator
              color={colors.primary}
              size="small"
            />
          ) : (
            <Feather
              name="heart"
              size={20}
              color={favorite ? colors.primary : colors.textSecondary}
              fill={favorite ? colors.primary : 'none'}
            />
          )}
          <Text style={styles.favoriteBtnText}>
            {favorite ? 'En favoritos' : 'Agregar a favoritos'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  heroBlock: {
    width: '100%',
    height: 260,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,20,0.35)',
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 44,
    paddingHorizontal: 24,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  yearBadge: {
    backgroundColor: colors.badgeNeutral,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  yearText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: fonts.headingExtraBold,
  },
  developer: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  ratingLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    color: colors.warning,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  synopsisBlock: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
  },
  synopsisText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
  libraryBlock: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 24,
  },
  libraryRow: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
  },
  reviewInput: {
    minHeight: 72,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlignVertical: 'top',
  },
  reviewBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  saveErrorText: {
    color: colors.warning,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  favoriteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.badgeNeutral,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
