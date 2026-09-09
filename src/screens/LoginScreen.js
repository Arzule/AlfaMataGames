// src/screens/LoginScreen.js
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Credenciales estáticas de prueba para esta entrega (sin backend real)
const TEST_CREDENTIALS = {
  email: 'drago@gmail.com',
  password: '12345678',
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleSubmit = () => {
    if (!validate()) return;

    const isValidUser =
      email.trim().toLowerCase() === TEST_CREDENTIALS.email &&
      password === TEST_CREDENTIALS.password;

    if (!isValidUser) {
      setErrors({ general: 'Correo o contraseña incorrectos' });
      return;
    }

    navigation.replace('MainTabs');
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
          {/* Campo correo */}
          <View style={styles.field}>
            <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
            <View
              style={[
                styles.inputBox,
                errors.email && styles.inputBoxError,
              ]}
            >
              <Feather name="mail" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="drago@gmail.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Campo contraseña */}
          <View style={styles.field}>
            <Text style={styles.label}>CONTRASEÑA</Text>
            <View
              style={[
                styles.inputBox,
                errors.password && styles.inputBoxError,
              ]}
            >
              <Feather name="lock" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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

          {errors.general && (
            <Text style={[styles.errorText, styles.errorGeneral]}>{errors.general}</Text>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Iniciar sesión</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandHeader: {
    alignItems: 'center',
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
    marginBottom: 20,
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
  submitBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});
