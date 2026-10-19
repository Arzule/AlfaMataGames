// src/hooks/useRecentSearches.js
// Búsquedas recientes del usuario guardadas con AsyncStorage (máx. 5, la más nueva primero).
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_RECENT = 5;

// Una lista por usuario para no mezclar búsquedas entre cuentas del mismo dispositivo.
function storageKey(userId) {
  return `alfamatagames.recentSearches.${userId ?? 'anon'}`;
}

export function useRecentSearches(userId) {
  const [recent, setRecent] = useState([]);

  // Cargar al montar o al cambiar de usuario.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        const parsed = raw ? JSON.parse(raw) : [];
        if (isMounted) setRecent(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        if (isMounted) setRecent([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Actualiza el estado y lo persiste (un fallo al guardar no rompe la UI).
  const persist = useCallback(
    (updater) => {
      setRecent((current) => {
        const next = updater(current);
        AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [userId]
  );

  // Agrega un término al inicio, sin duplicados (ignorando mayúsculas).
  const addSearch = useCallback(
    (term) => {
      const clean = (term ?? '').trim();
      if (!clean) return;
      persist((current) =>
        [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(
          0,
          MAX_RECENT
        )
      );
    },
    [persist]
  );

  const removeSearch = useCallback(
    (term) => persist((current) => current.filter((item) => item !== term)),
    [persist]
  );

  const clearSearches = useCallback(() => persist(() => []), [persist]);

  return { recent, addSearch, removeSearch, clearSearches };
}

export default useRecentSearches;
