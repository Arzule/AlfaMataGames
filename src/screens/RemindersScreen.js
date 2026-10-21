// src/screens/RemindersScreen.js
// Recordatorios activos (juegos y diario) con opción de cancelarlos.
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';
import {
  NOTIFICATIONS_SUPPORTED,
  cancelAllReminders,
  cancelReminder,
  listReminders,
} from '../services/notifications';
import { getDailyReminderPref, setDailyReminderPref } from '../services/preferences';
import { confirmAction } from '../utils/confirm';
import { formatDateTime, formatTime } from '../utils/dateFormat';

export default function RemindersScreen({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(async () => {
    if (!NOTIFICATIONS_SUPPORTED) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setItems(await listReminders());
    } catch (err) {
      setError('No se pudieron leer los recordatorios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Al cancelar el diario también se apaga la preferencia (para que no vuelva al iniciar sesión).
  const disableDailyPref = async () => {
    const pref = await getDailyReminderPref(user?.id);
    await setDailyReminderPref(user?.id, { ...pref, enabled: false });
  };

  const handleCancel = async (item) => {
    const confirmed = await confirmAction({
      title: 'Cancelar recordatorio',
      message:
        item.type === 'daily'
          ? '¿Desactivar el recordatorio diario?'
          : `¿Cancelar el recordatorio de ${item.gameName}?`,
      confirmText: 'Cancelar recordatorio',
      cancelText: 'Volver',
      destructive: true,
      icon: 'bell-off',
    });
    if (!confirmed) return;
    setActionError(null);
    try {
      await cancelReminder(item.id);
      if (item.type === 'daily') await disableDailyPref();
      setItems((current) => current.filter((other) => other.id !== item.id));
    } catch (err) {
      setActionError('No se pudo cancelar el recordatorio.');
    }
  };

  const handleCancelAll = async () => {
    const confirmed = await confirmAction({
      title: 'Cancelar todos',
      message: 'Se cancelarán todos los recordatorios, incluido el diario.',
      confirmText: 'Cancelar todos',
      cancelText: 'Volver',
      destructive: true,
      icon: 'bell-off',
    });
    if (!confirmed) return;
    setActionError(null);
    try {
      await cancelAllReminders();
      await disableDailyPref();
      setItems([]);
    } catch (err) {
      setActionError('No se pudieron cancelar los recordatorios.');
    }
  };

  const renderItem = ({ item }) => {
    const isDaily = item.type === 'daily';
    const content = (
      <>
        <View style={styles.iconWrap}>
          <Feather name={isDaily ? 'repeat' : 'bell'} size={16} color={colors.primary} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {isDaily ? 'Recordatorio diario' : item.gameName}
          </Text>
          <Text style={styles.itemSubtitle}>
            {isDaily
              ? `Todos los días a las ${formatTime(item.hour, item.minute)}`
              : formatDateTime(item.fireAt)}
          </Text>
        </View>
      </>
    );

    return (
      <View style={styles.item}>
        {isDaily ? (
          <View style={styles.itemMain}>{content}</View>
        ) : (
          <TouchableOpacity
            style={styles.itemMain}
            onPress={() => navigation.navigate('GameDetail', { gameId: item.gameId })}
          >
            {content}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => handleCancel(item)}
          accessibilityLabel="Cancelar recordatorio"
        >
          <Feather name="x" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Recordatorios"
        left={
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver"
          >
            <Feather name="arrow-left" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        }
        right={
          items.length > 1 ? (
            <TouchableOpacity onPress={handleCancelAll}>
              <Text style={styles.linkText}>Cancelar todos</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

      {!NOTIFICATIONS_SUPPORTED ? (
        <EmptyState
          icon="bell-off"
          title="No disponible en la web"
          message="Los recordatorios funcionan en la app del celular."
        />
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="Sin recordatorios"
              message="Programa uno desde el detalle de un juego o activa el diario en Perfil."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  actionError: {
    color: colors.warning,
    fontSize: 12,
    fontFamily: fonts.body,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.badgeNeutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  itemSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  cancelBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});
