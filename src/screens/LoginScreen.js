// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import FormInput from '../components/FormInput';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // La navegación cambia automáticamente al iniciar sesión.
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.brandHeader}>
          <View style={styles.logoPlaceholder}>
            <Feather name="cpu" size={28} color={colors.primary} />
          </View>
          <Text style={styles.brandName}>AlfaMataGames</Text>
          <Text style={styles.brandSub}>Tus juegos. Tu biblioteca. Tu legado.</Text>
        </View>

        <View style={styles.form}>
          <FormInput
            label="CORREO ELECTRÓNICO"
            icon="mail"
            placeholder="drago@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!submitting}
            error={errors.email}
          />

          <FormInput
            label="CONTRASEÑA"
            icon="lock"
            placeholder="••••••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!submitting}
            error={errors.password}
          />

          {errors.general && (
            <Text style={[styles.errorText, styles.errorGeneral]}>{errors.general}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.submitBtnText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Register')}
            disabled={submitting}
          >
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Prueba con: drago@gmail.com / 12345678
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandHeader: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: fonts.headingExtraBold,
    marginBottom: 4,
  },
  brandSub: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  form: {
    width: '100%',
    maxWidth: 420,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 6,
  },
  errorGeneral: {
    textAlign: 'center',
    marginBottom: 12,
  },
  submitBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  linkRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: 16,
  },
});