// src/screens/GameDetailScreen.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { getGameDetail } from '../services/gamesApi';
import { useLibrary } from '../hooks/useLibrary';
import Rating from '../components/Rating';
import StatusChips from '../components/StatusChips';
import ErrorState from '../components/ErrorState';
import ReviewCard from '../components/ReviewCard';
import Synopsis from '../components/Synopsis';
import ReminderSheet from '../components/ReminderSheet';
import DateTimePickerModal from '../components/DateTimePickerModal';
import { useGameReviews } from '../hooks/useGameReviews';
import { useGameDescription } from '../hooks/useGameDescription';
import { useGameReminder, REMINDER_PRESETS } from '../hooks/useGameReminder';
import { formatDateTime } from '../utils/dateFormat';

// Margen sobre la reseña al desplazarla para que quede a la vista con el teclado abierto.
const REVIEW_SCROLL_MARGIN = 16;
// Igual que REVIEW_MAX_LENGTH del backend.
const REVIEW_MAX_LENGTH = 1000;
// Ancho máximo del contenido en tablets y web.
const CONTENT_MAX_WIDTH = 720;
// Solo web en pantallas anchas: el banner va al costado (columna fija) y la información al lado.
const WIDE_LAYOUT_MIN_WIDTH = 1024;
const HERO_HEIGHT = 260;
const HERO_WIDE_HEIGHT = 420;

export default function GameDetailScreen({ route, navigation }) {
  const { gameId } = route.params;
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const wide = isWeb && windowWidth >= WIDE_LAYOUT_MIN_WIDTH;
  // Proporción real del banner (se conoce al cargar la imagen); 16:9 mientras tanto.
  const [bannerRatio, setBannerRatio] = useState(16 / 9);

  const { getEntry, isFavorite, saveEntry, loading: libraryLoading } = useLibrary();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [saveError, setSaveError] = useState(null);
  // Al cambiar, vuelve a pedir el detalle ("Reintentar").
  const [reloadKey, setReloadKey] = useState(0);

  const entry = getEntry(gameId);
  const favorite = isFavorite(gameId);
  const savedReview = entry?.review ?? '';

  const [reviewText, setReviewText] = useState(savedReview);
  useEffect(() => {
    setReviewText(savedReview);
  }, [savedReview]);

  const community = useGameReviews(gameId);
  // Sinopsis en español desde el backend; si falla, la original del detalle (IGDB).
  const description = useGameDescription(gameId, game?.description);

  // Recordatorio para jugar: hoja de opciones y selector de fecha propio.
  const gameReminder = useGameReminder({ gameId, gameName: game?.name ?? 'este juego' });
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSelectPreset = (key) => {
    setSheetVisible(false);
    const preset = REMINDER_PRESETS.find((item) => item.key === key);
    if (preset) gameReminder.schedule(preset.getDate());
  };
  const handlePickCustom = () => {
    setSheetVisible(false);
    setPickerVisible(true);
  };
  const handleCustomDate = (date) => {
    setPickerVisible(false);
    gameReminder.schedule(date);
  };

  // Teclado: la reseña se desplaza a la vista y el pie se oculta para dar espacio.
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const reviewRowRef = useRef(null);
  const reviewFocusedRef = useRef(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const scrollToReview = useCallback(() => {
    // Espera a que KeyboardAvoidingView aplique su espacio antes de medir.
    setTimeout(() => {
      if (!reviewRowRef.current || !contentRef.current) return;
      reviewRowRef.current.measureLayout(
        contentRef.current,
        (x, y) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - REVIEW_SCROLL_MARGIN),
            animated: true,
          });
        },
        () => {}
      );
    }, 150);
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      if (reviewFocusedRef.current) scrollToReview();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToReview]);

  const handleReviewFocus = () => {
    reviewFocusedRef.current = true;
    // Si el teclado ya estaba abierto no llega un nuevo keyboardDidShow.
    if (keyboardVisible) scrollToReview();
  };
  const handleReviewBlur = () => {
    reviewFocusedRef.current = false;
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
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
  }, [gameId, reloadKey]);

  const backButton = (
    <TouchableOpacity
      accessibilityRole="button"
      style={styles.iconBtn}
      hitSlop={4}
      onPress={() => navigation.goBack()}
      accessibilityLabel="Volver"
    >
      <Feather name="arrow-left" size={16} color={colors.textPrimary} />
    </TouchableOpacity>
  );

  // Mientras carga o si falla, el botón de volver sigue disponible (en web no hay botón
  // atrás del sistema).
  if (loading || error || !game) {
    return (
      <View style={styles.flex}>
        <View style={[styles.heroActions, { paddingTop: insets.top + 12 }]}>{backButton}</View>
        <View style={styles.centered}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <ErrorState
              message={error ?? 'Juego no encontrado.'}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          )}
        </View>
      </View>
    );
  }

  const developer = game.developer ?? 'Desarrollador desconocido';
  const platforms = game.platforms?.length ? game.platforms.join(', ') : 'N/D';
  // released llega como 'AAAA-MM-DD'.
  const year = game.released ? game.released.slice(0, 4) : '—';

  // Resumen que se guarda la primera vez que el juego entra a la biblioteca.
  const summary = {
    id: game.id,
    name: game.name,
    image: game.image ?? null,
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

  // Web ancha: el banner (o la portada si no hay banner) va completo como fondo semitransparente.
  const bannerBackground = wide && Boolean(game.heroImage);
  // En web ancha (banner o portada de fondo) los textos grises pasan a un tono casi blanco.
  const textTone = wide ? styles.textOnBanner : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View ref={contentRef} collapsable={false}>
          {bannerBackground && game.heroIsCover ? (
            // Web ancha sin banner: la portada completa, del alto de la pantalla, centrada, como
            // fondo semitransparente; se desvanece a los lados y abajo.
            <View style={[styles.bannerBackground, { height: windowHeight }]} pointerEvents="none">
              <View style={[styles.coverBackground, { height: windowHeight }]}>
                <Image
                  source={{ uri: game.heroImage }}
                  style={[styles.heroImage, styles.bannerBackgroundImage]}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={[colors.background, 'transparent', 'transparent', colors.background]}
                  locations={[0, 0.2, 0.8, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroImage}
                />
              </View>
              <LinearGradient
                colors={['transparent', colors.backgroundFadeSoft, colors.background]}
                locations={[0.4, 0.7, 1]}
                style={styles.heroImage}
              />
            </View>
          ) : bannerBackground ? (
            // Web ancha con banner: la imagen completa (a todo el ancho, con su proporción, sin
            // recorte) como fondo semitransparente detrás del contenido, desvanecida abajo.
            <View
              style={[styles.bannerBackground, { height: windowWidth / bannerRatio }]}
              pointerEvents="none"
            >
              <Image
                source={{ uri: game.heroImage }}
                style={[styles.heroImage, styles.bannerBackgroundImage]}
                contentFit="cover"
                transition={200}
                onLoad={(event) => {
                  const { width, height } = event.source || {};
                  if (width && height) setBannerRatio(width / height);
                }}
              />
              <LinearGradient
                colors={['transparent', colors.backgroundFadeSoft, colors.background]}
                locations={[0.4, 0.7, 1]}
                style={styles.heroImage}
              />
            </View>
          ) : null}
          {/* Hero. En web ancha (como Backloggd): banner a todo el ancho que se desvanece hacia el
              fondo por abajo; la información empieza sobre su parte baja. */}
          <View
            style={
              bannerBackground ? styles.bannerSpacer : wide ? styles.heroBlockWide : styles.heroBlock
            }
          >
            {bannerBackground ? null : game.heroIsCover ? (
              // Sin artwork: la portada centrada, con su proporción, al doble del alto del banner
              // (se ve solo su mitad superior, sin estirarla).
              <View style={styles.heroCoverWrap} pointerEvents="none">
                <View style={[styles.heroCover, { height: (wide ? HERO_WIDE_HEIGHT : HERO_HEIGHT) * 2 }]}>
                  <Image
                    source={game.heroImage ? { uri: game.heroImage } : null}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={200}
                  />
                  {/* Desvanecido a los lados de la portada. */}
                  <LinearGradient
                    colors={[colors.background, 'transparent', 'transparent', colors.background]}
                    locations={[0, 0.18, 0.82, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.heroImage}
                  />
                </View>
              </View>
            ) : (
              <Image
                source={game.heroImage ? { uri: game.heroImage } : null}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
              />
            )}
            {bannerBackground ? null : wide ? (
              <>
                {/* Desvanecido largo y suave: termina a la altura del final del título. */}
                <LinearGradient
                  colors={[
                    'transparent',
                    colors.backgroundFadeSoft,
                    colors.backgroundFadeStrong,
                    colors.background,
                  ]}
                  locations={[0.2, 0.5, 0.7, 0.85]}
                  style={styles.heroImage}
                  pointerEvents="none"
                />
              </>
            ) : (
              <>
                <View style={styles.heroOverlay} />
                <View style={[styles.heroActions, { paddingTop: insets.top + 12 }]}>
                  {backButton}
                </View>
              </>
            )}
          </View>

          {/* Meta */}
          <View
            style={[
              styles.metaSection,
              wide && (bannerBackground ? styles.metaSectionOverBanner : styles.metaSectionWide),
            ]}
          >
            {wide ? null : (
              <View style={styles.tagsRow}>
                <View style={styles.yearBadge}>
                  <Text style={[styles.yearText, textTone]}>{year}</Text>
                </View>
              </View>
            )}

            {wide ? (
              // Web ancha: volver a la izquierda del título; el año va junto al estudio.
              <View style={styles.titleRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Volver"
                  style={styles.backBtnInline}
                  hitSlop={4}
                  onPress={() => navigation.goBack()}
                >
                  <Feather name="arrow-left" size={18} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={[styles.title, styles.titleFlex]}>{game.name}</Text>
              </View>
            ) : (
              <Text style={styles.title}>{game.name}</Text>
            )}
            {wide ? (
              // Web ancha: estudio en su línea y el año debajo.
              <>
                <Text style={[styles.developer, textTone]}>{developer}</Text>
                <View style={[styles.yearBadge, styles.yearBadgeAlone]}>
                  <Text style={[styles.yearText, textTone]}>{year}</Text>
                </View>
              </>
            ) : (
              <Text style={[styles.developer, textTone]}>{developer}</Text>
            )}

            <View style={[styles.ratingSection, wide && styles.plainBox, wide && styles.ratingStacked]}>
              <Text style={[styles.ratingLabel, textTone]}>VALORACIÓN</Text>
              <View style={styles.starsRow}>
                <Feather name="star" size={16} color={colors.warning} />
                <Text style={styles.ratingValue}>{game.rating?.toFixed(1) ?? '0.0'}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, wide && styles.plainBox]}>
                <Feather name="monitor" size={14} color={colors.textSecondary} />
                <Text style={[styles.statLabel, textTone]}>PLATAFORMAS</Text>
                <Text style={styles.statValue} numberOfLines={2}>
                  {platforms}
                </Text>
              </View>
            </View>

            <Synopsis
              text={description.text}
              original={description.original}
              translated={description.translated}
              notice={description.notice}
              loading={description.loading}
              onImage={wide}
            />

            {/* Mi biblioteca */}
            <View style={styles.libraryBlock}>
              <Text style={styles.sectionTitle}>MI BIBLIOTECA</Text>

              <View style={styles.libraryRow}>
                <Text style={[styles.fieldLabel, textTone]}>Estado</Text>
                <StatusChips
                  value={entry?.status ?? null}
                  onChange={canEdit ? handleStatusChange : undefined}
                />
              </View>

              <View style={styles.libraryRow}>
                <Text style={[styles.fieldLabel, textTone]}>Tu puntuación</Text>
                <Rating
                  value={entry?.userScore ?? null}
                  onChange={canEdit ? handleScoreChange : undefined}
                  readOnly={!canEdit}
                />
              </View>

              <View ref={reviewRowRef} collapsable={false} style={styles.libraryRow}>
                <Text style={[styles.fieldLabel, textTone]}>Tu reseña</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Escribe tu reseña..."
                  placeholderTextColor={colors.textMuted}
                  value={reviewText}
                  onChangeText={setReviewText}
                  onFocus={handleReviewFocus}
                  onBlur={handleReviewBlur}
                  multiline
                  maxLength={REVIEW_MAX_LENGTH}
                  editable={!libraryLoading}
                />
                <Text style={[styles.counterText, textTone]}>
                  {reviewText.length}/{REVIEW_MAX_LENGTH}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
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

              {/* Recordatorio para jugar (notificación local; no disponible en web) */}
              <View style={styles.libraryRow}>
                <Text style={[styles.fieldLabel, textTone]}>Recordatorio</Text>
                {!gameReminder.supported ? (
                  <Text style={[styles.hintText, textTone]}>
                    Los recordatorios están disponibles en la app del celular.
                  </Text>
                ) : gameReminder.reminder ? (
                  <View style={styles.reminderActive}>
                    <Feather name="bell" size={16} color={colors.primary} />
                    <Text style={styles.reminderText}>
                      {formatDateTime(gameReminder.reminder.fireAt)}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={gameReminder.cancel}
                      disabled={gameReminder.busy}
                      hitSlop={8}
                    >
                      <Text style={styles.linkText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.reminderBtn, gameReminder.busy && styles.btnDisabled]}
                    onPress={() => setSheetVisible(true)}
                    disabled={gameReminder.busy}
                  >
                    {gameReminder.busy ? (
                      <ActivityIndicator color={colors.textPrimary} size="small" />
                    ) : (
                      <Feather name="bell" size={16} color={colors.textPrimary} />
                    )}
                    <Text style={styles.reminderBtnText}>Recordarme jugar esto</Text>
                  </TouchableOpacity>
                )}
                {gameReminder.feedback ? (
                  <Text
                    style={[
                      styles.hintText,
                      gameReminder.feedback.type === 'error' && styles.saveErrorText,
                      gameReminder.feedback.type === 'success' && styles.successText,
                    ]}
                  >
                    {gameReminder.feedback.text}
                  </Text>
                ) : null}
                {gameReminder.permissionStatus === 'blocked' ? (
                  <TouchableOpacity accessibilityRole="button" onPress={gameReminder.openSettings}>
                    <Text style={styles.linkText}>
                      Notificaciones bloqueadas · Abrir ajustes
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {libraryLoading ? (
                <Text style={[styles.hintText, textTone]}>Cargando tu biblioteca...</Text>
              ) : null}
              {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
            </View>

            {/* Reseñas de otros usuarios, la más reciente primero */}
            <View style={styles.communityBlock}>
              <Text style={styles.sectionTitle}>RESEÑAS DE LA COMUNIDAD</Text>

              {community.loading ? (
                <ActivityIndicator color={colors.primary} style={styles.communitySpinner} />
              ) : community.error && !community.reviews.length ? (
                <View style={styles.communityMessage}>
                  <Text style={[styles.hintText, textTone]}>{community.error}</Text>
                  <TouchableOpacity accessibilityRole="button" onPress={community.reload}>
                    <Text style={styles.linkText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              ) : !community.reviews.length ? (
                <Text style={[styles.hintText, textTone]}>
                  Nadie más ha reseñado este juego todavía.
                </Text>
              ) : (
                <>
                  {community.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {community.error ? (
                    <Text style={styles.saveErrorText}>{community.error}</Text>
                  ) : null}
                  {community.hasMore ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={styles.moreBtn}
                      onPress={community.loadMore}
                      disabled={community.loadingMore}
                    >
                      {community.loadingMore ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                      ) : (
                        <Text style={styles.linkText}>Ver más reseñas</Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer (oculto con el teclado abierto para dejar espacio a la reseña) */}
      {keyboardVisible ? null : (
        <View style={[styles.footerBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            accessibilityRole="button"
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
      )}

      <ReminderSheet
        visible={sheetVisible}
        title="Recordarme jugar esto"
        options={REMINDER_PRESETS}
        onSelect={handleSelectPreset}
        onPickCustom={handlePickCustom}
        onClose={() => setSheetVisible(false)}
      />
      {gameReminder.supported ? (
        <DateTimePickerModal
          visible={pickerVisible}
          mode="datetime"
          value={new Date(Date.now() + 60 * 60 * 1000)}
          minimumDate={new Date()}
          title="Fecha y hora del recordatorio"
          onConfirm={handleCustomDate}
          onCancel={() => setPickerVisible(false)}
        />
      ) : null}
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
  },
  heroBlock: {
    width: '100%',
    height: HERO_HEIGHT,
  },
  bannerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  // Más transparente para no interferir con la lectura.
  bannerBackgroundImage: {
    opacity: 0.5,
  },
  coverBackground: {
    alignSelf: 'center',
    aspectRatio: 264 / 374,
  },
  bannerSpacer: {
    height: 160,
  },
  metaSectionOverBanner: {
    zIndex: 1,
  },
  heroBlockWide: {
    width: '100%',
    height: HERO_WIDE_HEIGHT,
  },
  heroCoverWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroCover: {
    aspectRatio: 264 / 374,
  },
  metaSectionWide: {
    // Sube sobre la parte baja del banner, ya desvanecida.
    marginTop: -140,
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
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleFlex: {
    flex: 1,
  },
  yearBadgeAlone: {
    alignSelf: 'flex-start',
  },
  // Web ancha: "VALORACIÓN" en una línea y el puntaje debajo.
  ratingStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 4,
  },
  // Distinto del fondo (tarjeta con borde y flecha violeta) sin desentonar con la página.
  backBtnInline: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primary,
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
  // Web ancha: valoración y plataformas sin recuadro, como el resto del detalle.
  textOnBanner: {
    color: colors.textOnImage,
  },
  plainBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.heading,
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
  counterText: {
    alignSelf: 'flex-end',
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  reviewBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.badgeNeutral,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  reminderActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  successText: {
    color: colors.success,
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
  communityBlock: {
    gap: 12,
    paddingBottom: 32,
  },
  communitySpinner: {
    paddingVertical: 16,
  },
  communityMessage: {
    gap: 4,
  },
  linkText: {
    color: colors.primaryText,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  moreBtn: {
    alignSelf: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  favoriteBtn: {
    flex: 1,
    maxWidth: CONTENT_MAX_WIDTH - 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
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
