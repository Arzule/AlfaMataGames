// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { confirmAction } from '../utils/confirm';
import { clearCatalogCache } from '../services/catalogCache';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [clearing, setClearing] = useState(false);
  const [cacheMessage, setCacheMessage] = useState(null);

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

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Feather name="user" size={28} color={colors.primary} />
          </View>
          <Text style={styles.name}>{user?.name ?? 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
        </View>

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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.textPrimary} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.badgeNeutral,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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