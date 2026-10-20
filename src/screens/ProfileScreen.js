// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import DateTimePickerModal from '../components/DateTimePickerModal';
import { useAuth } from '../hooks/useAuth';
import { useAvatarPicker, CAMERA_SUPPORTED } from '../hooks/useAvatarPicker';
import { confirmAction } from '../utils/confirm';
import { clearCatalogCache } from '../services/catalogCache';
import { getShakeEnabled, setShakeEnabled } from '../services/preferences';
import { SHAKE_SUPPORTED, checkShakeAvailable } from '../hooks/useShakeDetector';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { formatTime } from '../utils/dateFormat';

// Solo en desarrollo: lanza durante el render para probar la pantalla de ErrorBoundary.
function RenderCrashTest() {
  throw new Error('Error de prueba simulado desde Perfil.');
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [clearing, setClearing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState(null);
  const [crashTest, setCrashTest] = useState(false);
  const avatarPicker = useAvatarPicker();
  const cameraBlocked = avatarPicker.cameraStatus === 'blocked';

  // "Agitar para descubrir": null mientras se comprueba el sensor.
  const [shakeAvailable, setShakeAvailable] = useState(null);
  const [shakeEnabled, setShakeEnabledState] = useState(true);
  const [shakeMessage, setShakeMessage] = useState(null);
  useEffect(() => {
    if (!SHAKE_SUPPORTED) return undefined;
    let active = true;
    (async () => {
      const [available, enabled] = await Promise.all([checkShakeAvailable(), getShakeEnabled()]);
      if (!active) return;
      setShakeAvailable(available);
      setShakeEnabledState(enabled);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Recordatorio diario (notificación local).
  const daily = useDailyReminder(user?.id);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const dailyTime = new Date();
  dailyTime.setHours(daily.pref.hour, daily.pref.minute, 0, 0);

  const handleToggleShake = async (value) => {
    setShakeEnabledState(value);
    setShakeMessage(null);
    const saved = await setShakeEnabled(value);
    if (!saved) {
      setShakeEnabledState(!value);
      setShakeMessage('No se pudo guardar la preferencia.');
    }
  };

  // Borra la caché del catálogo y de imágenes; no cierra sesión ni toca preferencias.
  const handleClearCache = async () => {
    const confirmed = await confirmAction({
      title: 'Borrar caché',
      message: 'Se borrarán el catálogo guardado y las imágenes descargadas. Tu sesión no se cierra.',
      confirmText: 'Borrar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    setClearing(true);
    setCacheMessage(null);
    try {
      await clearCatalogCache();
      // En web estos métodos devuelven false: las imágenes las guarda el navegador.
      await Image.clearMemoryCache();
      await Image.clearDiskCache();
      setCacheMessage(
        Platform.OS === 'web'
          ? 'Caché del catálogo borrada. Las imágenes las gestiona el navegador.'
          : 'Caché borrada.'
      );
    } catch (err) {
      setCacheMessage('No se pudo borrar la caché.');
    } finally {
      setClearing(false);
    }
  };

  // Pide confirmación antes de cerrar sesión (compatible con web).
  const handleLogout = async () => {
    const confirmed = await confirmAction({
      title: 'Cerrar sesión',
      message: '¿Seguro que deseas salir de tu cuenta?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
    });
    if (confirmed) {
      await logout();
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Perfil" style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            <Avatar uri={user?.avatar} name={user?.name} size={96} />
            {avatarPicker.busy ? (
              <View style={styles.avatarBusy}>
                <ActivityIndicator color={colors.textPrimary} />
              </View>
            ) : null}
          </View>
          <Text style={styles.name}>{user?.name ?? 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>

          {/* Acciones de la foto de perfil */}
          <View style={styles.photoActions}>
            {CAMERA_SUPPORTED ? (
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={avatarPicker.takePhoto}
                disabled={avatarPicker.busy}
              >
                <Feather name="camera" size={16} color={colors.textPrimary} />
                <Text style={styles.photoBtnText}>Cámara</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.photoBtn}
              onPress={avatarPicker.pickPhoto}
              disabled={avatarPicker.busy}
            >
              <Feather name="image" size={16} color={colors.textPrimary} />
              <Text style={styles.photoBtnText}>Galería</Text>
            </TouchableOpacity>
            {user?.avatar ? (
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={avatarPicker.deletePhoto}
                disabled={avatarPicker.busy}
                accessibilityLabel="Eliminar foto de perfil"
              >
                <Feather name="trash-2" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {avatarPicker.feedback ? (
            <Text
              style={[
                styles.feedback,
                avatarPicker.feedback.type === 'error' && styles.feedbackError,
                avatarPicker.feedback.type === 'success' && styles.feedbackSuccess,
              ]}
            >
              {avatarPicker.feedback.text}
            </Text>
          ) : null}

          {CAMERA_SUPPORTED && cameraBlocked ? (
            <TouchableOpacity onPress={avatarPicker.openSettings}>
              <Text style={styles.settingsLink}>
                Permiso de cámara bloqueado · Abrir ajustes
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* En web no hay sensor: la opción se oculta (queda el botón "Juego al azar"). */}
        {SHAKE_SUPPORTED ? (
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Feather name="smartphone" size={18} color={colors.textPrimary} />
              <View style={styles.settingTexts}>
                <Text style={styles.settingTitle}>Agitar para descubrir</Text>
                <Text style={styles.settingHint}>
                  {shakeAvailable === false
                    ? 'Tu dispositivo no tiene acelerómetro disponible.'
                    : 'Agita el celular en el Catálogo para abrir un juego al azar.'}
                </Text>
              </View>
              <Switch
                value={shakeAvailable !== false && shakeEnabled}
                onValueChange={handleToggleShake}
                disabled={!shakeAvailable}
                trackColor={{ false: colors.badgeNeutral, true: colors.primary }}
                thumbColor={colors.textPrimary}
                accessibilityLabel="Agitar para descubrir"
              />
            </View>
            {shakeMessage ? <Text style={[styles.feedback, styles.feedbackError]}>{shakeMessage}</Text> : null}
          </View>
        ) : null}

        {/* Recordatorio diario */}
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Feather name="bell" size={18} color={colors.textPrimary} />
            <View style={styles.settingTexts}>
              <Text style={styles.settingTitle}>Recordatorio diario</Text>
              <Text style={styles.settingHint}>
                {daily.supported
                  ? 'Una notificación al día para jugar algo de tu biblioteca.'
                  : 'Las notificaciones están disponibles en la app del celular.'}
              </Text>
            </View>
            {daily.supported ? (
              <Switch
                value={daily.pref.enabled}
                onValueChange={daily.setEnabled}
                disabled={!daily.loaded || daily.busy}
                trackColor={{ false: colors.badgeNeutral, true: colors.primary }}
                thumbColor={colors.textPrimary}
                accessibilityLabel="Recordatorio diario"
              />
            ) : null}
          </View>
          {daily.supported && daily.pref.enabled ? (
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setTimePickerVisible(true)}
              disabled={daily.busy}
            >
              <Text style={styles.settingHint}>Hora</Text>
              <Text style={styles.timeValue}>{formatTime(daily.pref.hour, daily.pref.minute)}</Text>
              <Text style={styles.settingsLinkInline}>Cambiar</Text>
            </TouchableOpacity>
          ) : null}
          {daily.feedback ? (
            <Text
              style={[
                styles.feedback,
                daily.feedback.type === 'error' && styles.feedbackError,
                daily.feedback.type === 'success' && styles.feedbackSuccess,
              ]}
            >
              {daily.feedback.text}
            </Text>
          ) : null}
          {daily.supported && daily.permissionStatus === 'blocked' ? (
            <TouchableOpacity onPress={daily.openSettings}>
              <Text style={styles.settingsLink}>
                Notificaciones bloqueadas · Abrir ajustes
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {daily.supported ? (
          <DateTimePickerModal
            visible={timePickerVisible}
            mode="time"
            value={dailyTime}
            title="Hora del recordatorio"
            onConfirm={(date) => {
              setTimePickerVisible(false);
              daily.setTime(date);
            }}
            onCancel={() => setTimePickerVisible(false)}
          />
        ) : null}

        <View style={styles.cacheBlock}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleClearCache}
            disabled={clearing}
          >
            {clearing ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <Feather name="trash-2" size={18} color={colors.textPrimary} />
            )}
            <Text style={styles.secondaryText}>Borrar caché</Text>
          </TouchableOpacity>
          {cacheMessage ? <Text style={styles.cacheMessage}>{cacheMessage}</Text> : null}
        </View>

        {__DEV__ ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCrashTest(true)}>
            <Feather name="alert-octagon" size={18} color={colors.warning} />
            <Text style={styles.secondaryText}>Simular error (solo desarrollo)</Text>
          </TouchableOpacity>
        ) : null}
        {crashTest ? <RenderCrashTest /> : null}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.textPrimary} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
  },
  avatarWrap: {
    marginBottom: 8,
  },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.badgeNeutral,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  feedback: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackError: {
    color: '#ef4444',
  },
  feedbackSuccess: {
    color: colors.success,
  },
  settingsLink: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    textAlign: 'center',
    paddingVertical: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fonts.headingExtraBold,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTexts: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  settingHint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingLeft: 30,
  },
  timeValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  settingsLinkInline: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  cacheBlock: {
    gap: 8,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
  },
  cacheMessage: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
});