// src/screens/ProfileScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { confirmAction } from '../utils/confirm';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

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
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Feather name="user" size={28} color={colors.primary} />
        </View>
        <Text style={styles.name}>{user?.name ?? 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color={colors.textPrimary} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 72,
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
    fontWeight: '800',
  },
  email: {
    color: colors.textSecondary,
    fontSize: 13,
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
    fontWeight: '700',
  },
});
