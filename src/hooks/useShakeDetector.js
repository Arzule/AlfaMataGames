// src/hooks/useShakeDetector.js
// Detecta cuando el usuario agita el celular con el acelerómetro (expo-sensors).
// Solo escucha con la pantalla enfocada y la app en primer plano; se desuscribe al salir.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';

// En web el acelerómetro exige permiso del navegador y no suele existir en escritorio:
// la función se oculta y se usa el botón "Juego al azar".
export const SHAKE_SUPPORTED = Platform.OS !== 'web';

const UPDATE_INTERVAL_MS = 100;
// Aceleración total (en g) que cuenta como sacudida; en reposo vale ~1 g.
const THRESHOLD_G = 1.8;
// Hacen falta dos picos dentro de esta ventana (un golpe aislado no cuenta).
const PEAK_WINDOW_MS = 800;
// Antirrebote: tras detectar una sacudida se ignoran las lecturas durante este tiempo.
const COOLDOWN_MS = 2000;

// true si el dispositivo tiene acelerómetro utilizable.
export async function checkShakeAvailable() {
  if (!SHAKE_SUPPORTED) return false;
  try {
    return await Accelerometer.isAvailableAsync();
  } catch (err) {
    return false;
  }
}

/**
 * @param {Object} options
 * @param {boolean} options.enabled  preferencia del usuario
 * @param {() => void} options.onShake  se llama una vez por gesto
 */
export function useShakeDetector({ enabled, onShake }) {
  const [focused, setFocused] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  // Referencia estable: cambiar el callback no reinicia la suscripción.
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  const listening = SHAKE_SUPPORTED && enabled && focused && appActive;

  useEffect(() => {
    if (!listening) return undefined;

    let subscription = null;
    let cancelled = false;
    let lastPeak = 0;
    let wasAbove = false;
    let cooldownUntil = 0;

    (async () => {
      if (!(await checkShakeAvailable()) || cancelled) return;

      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const now = Date.now();
        if (now < cooldownUntil) return;

        const above = Math.sqrt(x * x + y * y + z * z) > THRESHOLD_G;
        // Solo cuenta el flanco de subida: una lectura alta sostenida es un solo pico.
        if (above && !wasAbove) {
          if (now - lastPeak <= PEAK_WINDOW_MS) {
            lastPeak = 0;
            cooldownUntil = now + COOLDOWN_MS;
            onShakeRef.current?.();
          } else {
            lastPeak = now;
          }
        }
        wasAbove = above;
      });
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [listening]);

  return { listening };
}

export default useShakeDetector;
