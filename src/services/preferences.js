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
