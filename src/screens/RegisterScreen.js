// src/screens/RegisterScreen.js
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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      newErrors.name = 'El nombre debe tener entre 2 y 80 caracteres';
    }

    if (!trimmedEmail) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Ingresa un correo válido';
    }

    if (password.length < 6) {
      newErrors.password = 'Debe tener al menos 6 caracteres';
    }

    if (confirm !== password) {
      newErrors.confirm = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      // Al registrarse queda la sesión iniciada automáticamente.
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
            <Feather name="user-plus" size={26} color={colors.primary} />
          </View>
          <Text style={styles.brandName}>Crear cuenta</Text>
          <Text style={styles.brandSub}>Únete y arma tu biblioteca.</Text>
        </View>

        <View style={styles.form}>
          <FormInput
            label="NOMBRE"
            icon="user"
            placeholder="Tu nombre"
            value={name}
            onChangeText={setName}
            editable={!submitting}
            error={errors.name}
          />

          <FormInput
            label="CORREO ELECTRÓNICO"
            icon="mail"
            placeholder="tucorreo@ejemplo.com"
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

          <FormInput
            label="CONFIRMAR CONTRASEÑA"
            icon="lock"
            placeholder="••••••••••••"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            editable={!submitting}
            error={errors.confirm}
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
              <Text style={styles.submitBtnText}>Registrarme</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
            disabled={submitting}
          >
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
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
    marginBottom: 28,
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
    fontSize: 24,
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
});