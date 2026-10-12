// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          {/* Campo nombre */}
          <View style={styles.field}>
            <Text style={styles.label}>NOMBRE</Text>
            <View style={[styles.inputBox, errors.name && styles.inputBoxError]}>
              <Feather name="user" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!submitting}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Campo correo */}
          <View style={styles.field}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <View style={[styles.inputBox, errors.email && styles.inputBoxError]}>
              <Feather name="mail" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Campo contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>CONTRASEÑA</Text>
            <View style={[styles.inputBox, errors.password && styles.inputBoxError]}>
              <Feather name="lock" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!submitting}
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Campo confirmar contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
            <View style={[styles.inputBox, errors.confirm && styles.inputBoxError]}>
              <Feather name="lock" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                editable={!submitting}
              />
            </View>
            {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
          </View>

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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandHeader: {
    alignItems: 'center',
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
    fontWeight: '800',
    marginBottom: 4,
  },
  brandSub: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  form: {
    width: '100%',
  },
  field: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputBoxError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
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
    fontWeight: '700',
  },
  linkRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
