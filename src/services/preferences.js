// src/services/preferences.js
// Preferencias del dispositivo guardadas con AsyncStorage. Las funciones nunca lanzan.
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHAKE_KEY = 'alfamatagames.prefs.shakeToDiscover';

// "Agitar para descubrir": activado por defecto.
export async function getShakeEnabled() {
  try {
    const raw = await AsyncStorage.getItem(SHAKE_KEY);
    return raw === null ? true : raw === 'true';
  } catch (err) {
    return true;
  }
}

export async function setShakeEnabled(enabled) {
  try {
    await AsyncStorage.setItem(SHAKE_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (err) {
    return false;
  }
}

// Recordatorio diario, por usuario: { enabled, hour, minute }. Por defecto apagado a las 20:00.
const DAILY_DEFAULT = { enabled: false, hour: 20, minute: 0 };
const dailyKey = (userId) => `alfamatagames.prefs.dailyReminder.${userId ?? 'anon'}`;

export async function getDailyReminderPref(userId) {
  try {
    const raw = await AsyncStorage.getItem(dailyKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    if (
      parsed &&
      typeof parsed.enabled === 'boolean' &&
      Number.isInteger(parsed.hour) &&
      Number.isInteger(parsed.minute)
    ) {
      return parsed;
    }
  } catch (err) {
    // Preferencia dañada o almacenamiento no disponible: valores por defecto.
  }
  return { ...DAILY_DEFAULT };
}

export async function setDailyReminderPref(userId, pref) {
  try {
    await AsyncStorage.setItem(dailyKey(userId), JSON.stringify(pref));
    return true;
  } catch (err) {
    return false;
  }
}
