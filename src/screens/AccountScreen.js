// src/screens/AccountScreen.js
// Gestión de la cuenta: editar nombre, cambiar contraseña y eliminar la cuenta.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import Header from '../components/Header';
import FormInput from '../components/FormInput';
import { useAuth } from '../hooks/useAuth';
import { confirmAction } from '../utils/confirm';
import { useOAuthProviders } from '../hooks/useOAuthProviders';
import { PROVIDER_ICONS } from '../components/SocialLoginButtons';
import { getIdentities, unlinkIdentity } from '../services/oauthApi';

// Mismos límites que el backend (utils/validators.js).
const NAME_MIN = 2;
const NAME_MAX = 80;
const PASSWORD_MIN = 6;

function Feedback({ feedback }) {
  if (!feedback) return null;
  return (
    <Text style={[styles.feedback, feedback.type === 'error' ? styles.error : styles.success]}>
      {feedback.text}
    </Text>
  );
}

function SubmitButton({ label, onPress, busy, destructive = false }) {
  return (
    <TouchableOpacity
      style={[styles.submitBtn, destructive && styles.submitBtnDanger, busy && styles.disabled]}
      onPress={onPress}
      disabled={busy}
    >
      {busy ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text style={styles.submitText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

// Nombre visible en el perfil y en las reseñas.
function NameSection() {
  const { user, updateName } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      setFeedback({ type: 'error', text: `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.` });
      return;
    }
    if (trimmed === user?.name) {
      setFeedback({ type: 'success', text: 'No hay cambios que guardar.' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await updateName(trimmed);
      setName(trimmed);
      setFeedback({ type: 'success', text: 'Nombre actualizado.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Nombre</Text>
      <FormInput
        icon="user"
        placeholder="Tu nombre"
        value={name}
        onChangeText={setName}
        maxLength={NAME_MAX}
        editable={!busy}
        style={styles.input}
      />
      <Feedback feedback={feedback} />
      <SubmitButton label="Guardar nombre" onPress={handleSave} busy={busy} />
    </View>
  );
}

// Cuentas de Google/Discord vinculadas: vincular o desvincular (nunca la última forma de entrar).
function LinkedAccountsSection() {
  const providers = useOAuthProviders();
  const { linkProvider } = useAuth();
  const [identities, setIdentities] = useState(null);
  const [busy, setBusy] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getIdentities();
      setIdentities(Array.isArray(data?.identities) ? data.identities : []);
    } catch (err) {
      setFeedback({ type: 'error', text: 'No se pudieron leer las cuentas vinculadas.' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!providers.length) return null;

  const handleLink = async (provider) => {
    setBusy(provider.id);
    setFeedback(null);
    try {
      const linked = await linkProvider(provider.id);
      if (linked) {
        await load();
        setFeedback({ type: 'success', text: `${provider.label} vinculado.` });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const handleUnlink = async (provider) => {
    const confirmed = await confirmAction({
      title: `Desvincular ${provider.label}`,
      message: `Ya no podrás iniciar sesión con ${provider.label} en esta cuenta.`,
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
      destructive: true,
      icon: 'link-2',
    });
    if (!confirmed) return;
    setBusy(provider.id);
    setFeedback(null);
    try {
      const data = await unlinkIdentity(provider.id);
      setIdentities(data?.identities ?? []);
      setFeedback({ type: 'success', text: `${provider.label} desvinculado.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Cuentas vinculadas</Text>
      {identities === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        providers.map((provider) => {
          const identity = identities.find((item) => item.provider === provider.id);
          return (
            <View key={provider.id} style={styles.linkRow}>
              <Ionicons
                name={PROVIDER_ICONS[provider.id] || 'log-in-outline'}
                size={18}
                color={colors.textPrimary}
              />
              <View style={styles.linkTexts}>
                <Text style={styles.linkTitle}>{provider.label}</Text>
                <Text style={styles.hint}>
                  {identity ? identity.email || 'Vinculada' : 'Sin vincular'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => (identity ? handleUnlink(provider) : handleLink(provider))}
                disabled={Boolean(busy)}
                accessibilityRole="button"
                accessibilityLabel={`${identity ? 'Desvincular' : 'Vincular'} ${provider.label}`}
              >
                {busy === provider.id ? (
                  <ActivityIndicator color={colors.textPrimary} size="small" />
                ) : (
                  <Text style={[styles.linkBtnText, identity && styles.error]}>
                    {identity ? 'Desvincular' : 'Vincular'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
      <Feedback feedback={feedback} />
    </View>
  );
}

// Solo para cuentas con contraseña propia.
function PasswordSection() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSave = async () => {
    let error = null;
    if (!current) error = 'Escribe tu contraseña actual.';
    else if (next.length < PASSWORD_MIN) {
      error = `La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
    } else if (next !== confirm) error = 'Las contraseñas nuevas no coinciden.';
    else if (next === current) error = 'La nueva contraseña debe ser distinta de la actual.';
    if (error) {
      setFeedback({ type: 'error', text: error });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setFeedback({ type: 'success', text: 'Contraseña actualizada.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Contraseña</Text>
      <FormInput
        icon="lock"
        placeholder="Contraseña actual"
        value={current}
        onChangeText={setCurrent}
        secureTextEntry
        autoCapitalize="none"
        editable={!busy}
        style={styles.input}
      />
      <FormInput
        icon="key"
        placeholder="Nueva contraseña"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        autoCapitalize="none"
        editable={!busy}
        style={styles.input}
      />
      <FormInput
        icon="key"
        placeholder="Confirmar nueva contraseña"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        editable={!busy}
        style={styles.input}
      />
      <Feedback feedback={feedback} />
      <SubmitButton label="Cambiar contraseña" onPress={handleSave} busy={busy} />
    </View>
  );
}

// Elimina la cuenta y toda su biblioteca; pide la contraseña si la cuenta la tiene.
function DeleteSection() {
  const { user, deleteAccount } = useAuth();
  const hasPassword = user?.hasPassword !== false;
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleDelete = async () => {
    if (hasPassword && !password) {
      setFeedback({ type: 'error', text: 'Escribe tu contraseña para confirmar.' });
      return;
    }
    const confirmed = await confirmAction({
      title: 'Eliminar cuenta',
      message:
        'Se borrarán tu cuenta, tu biblioteca, tus reseñas y tus recordatorios. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
      icon: 'alert-triangle',
    });
    if (!confirmed) return;

    setBusy(true);
    setFeedback(null);
    try {
      // Al terminar se cierra la sesión y la app vuelve al login (esta pantalla se desmonta).
      await deleteAccount(hasPassword ? password : undefined);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, styles.dangerCard]}>
      <Text style={[styles.cardTitle, styles.dangerTitle]}>Eliminar cuenta</Text>
      <Text style={styles.hint}>
        Borra tu cuenta y todos sus datos de forma permanente.
      </Text>
      {hasPassword ? (
        <FormInput
          icon="lock"
          placeholder="Tu contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!busy}
          style={styles.input}
        />
      ) : null}
      <Feedback feedback={feedback} />
      <SubmitButton label="Eliminar mi cuenta" onPress={handleDelete} busy={busy} destructive />
    </View>
  );
}

export default function AccountScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Header
        title="Cuenta"
        subtitle={user?.email}
        left={
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Feather name="arrow-left" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <NameSection />
          <LinkedAccountsSection />
          {user?.hasPassword !== false ? <PasswordSection /> : null}
          <DeleteSection />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  linkTexts: {
    flex: 1,
    gap: 2,
  },
  linkTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  linkBtn: {
    minHeight: 44,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  dangerCard: {
    borderColor: colors.danger,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  dangerTitle: {
    color: colors.danger,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  input: {
    marginBottom: 0,
  },
  feedback: {
    fontSize: 12,
    fontFamily: fonts.body,
  },
  error: {
    color: colors.danger,
  },
  success: {
    color: colors.success,
  },
  submitBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  submitBtnDanger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
