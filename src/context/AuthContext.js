// src/context/AuthContext.js
// Maneja la sesión del usuario: token persistente (nativo/web) y estado global.
import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { setAuthToken, setUnauthorizedHandler } from '../services/apiClient';
import * as authApi from '../services/authApi';
import * as storage from '../utils/storage';
import { cancelAllReminders } from '../services/notifications';

// Clave con la que se guarda el token en el almacenamiento seguro.
const TOKEN_KEY = 'alfamatagames.token';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cierra la sesión en memoria, borra el token guardado y cancela los recordatorios
  // (son de esta cuenta; el diario se vuelve a programar al iniciar sesión).
  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setToken(null);
    await cancelAllReminders();
    try {
      await storage.removeItem(TOKEN_KEY);
    } catch (err) {
      // Si falla el borrado, la sesión en memoria ya quedó cerrada.
    }
  }, []);

  // Ante un token inválido/expirado detectado por el cliente, cerrar sesión.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Al montar: restaurar la sesión guardada y validarla contra el backend.
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const stored = await storage.getItem(TOKEN_KEY);
        if (stored) {
          setAuthToken(stored);
          const data = await authApi.getMe();
          if (!isMounted) return;
          if (!data || !data.user) {
            throw new Error('Respuesta inesperada del servidor');
          }
          setToken(stored);
          setUser(data.user);
        }
      } catch (err) {
        // Token inválido o expirado: limpiar la sesión.
        await clearSession();
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  // Guarda token y usuario (en estado y en el almacenamiento).
  const applySession = useCallback(async (data) => {
    // La respuesta del backend debe traer token y usuario; si no, es inválida.
    if (!data || !data.token || !data.user) {
      throw new Error('Respuesta inesperada del servidor');
    }
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    await storage.setItem(TOKEN_KEY, data.token);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password);
      await applySession(data);
      return data;
    },
    [applySession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await authApi.register(name, email, password);
      await applySession(data);
      return data;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  // Foto de perfil: el backend devuelve el usuario actualizado.
  const updateAvatar = useCallback(async (image) => {
    const data = await authApi.uploadAvatar(image);
    if (!data || !data.user) throw new Error('Respuesta inesperada del servidor');
    setUser(data.user);
  }, []);

  const removeAvatar = useCallback(async () => {
    const data = await authApi.deleteAvatar();
    if (!data || !data.user) throw new Error('Respuesta inesperada del servidor');
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateAvatar, removeAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
}
