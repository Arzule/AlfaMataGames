// src/components/SocialLoginButtons.js
// Botones "Continuar con Google/Discord" (solo los proveedores configurados en el backend).
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { useAuth } from '../hooks/useAuth';
import { useOAuthProviders } from '../hooks/useOAuthProviders';

export const PROVIDER_ICONS = { google: 'logo-google', discord: 'logo-discord' };

export default function SocialLoginButtons({ disabled = false }) {
  const providers = useOAuthProviders();
  const { loginWithProvider } = useAuth();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  if (!providers.length) return null;

  const handlePress = async (provider) => {
    setBusy(provider);
    setError(null);
    try {
      // Si inicia sesión, la navegación cambia sola (esta pantalla se desmonta).
      await loginWithProvider(provider);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>o continúa con</Text>
        <View style={styles.divider} />
      </View>
      {providers.map((provider) => (
        <TouchableOpacity
          key={provider.id}
          style={[styles.button, (disabled || busy) && styles.disabled]}
          onPress={() => handlePress(provider.id)}
          disabled={disabled || Boolean(busy)}
          accessibilityRole="button"
          accessibilityLabel={`Continuar con ${provider.label}`}
        >
          {busy === provider.id ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons
                name={PROVIDER_ICONS[provider.id] || 'log-in-outline'}
                size={18}
                color={colors.textPrimary}
              />
              <Text style={styles.buttonText}>Continuar con {provider.label}</Text>
            </>
          )}
        </TouchableOpacity>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

SocialLoginButtons.propTypes = {
  disabled: PropTypes.bool,
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});
