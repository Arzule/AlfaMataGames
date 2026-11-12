// src/context/AuthContext.js
// Maneja la sesión del usuario: token persistente (nativo/web) y estado global.
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { setAuthToken, setUnauthorizedHandler } from '../services/apiClient';
import * as authApi from '../services/authApi';
import * as storage from '../utils/storage';
import { cancelAllReminders } from '../services/notifications';
import { clearUserData } from '../services/preferences';
import { runOAuthFlow, completeWebRedirect } from '../services/socialAuth';
import { confirmAction } from '../utils/confirm';

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
      }

      // Web: volvimos del proveedor (login social, vincular o Steam) en esta misma pestaña.
      const redirect = await completeWebRedirect();
      if (isMounted && redirect) {
        if (redirect.data && redirect.kind === 'login' && redirect.data.token && redirect.data.user) {
          setAuthToken(redirect.data.token);
          setToken(redirect.data.token);
          setUser(redirect.data.user);
          await storage.setItem(TOKEN_KEY, redirect.data.token);
        } else if (redirect.data && redirect.kind === 'link' && redirect.data.user) {
          setUser(redirect.data.user);
        }
        const SUCCESS = {
          link: 'Cuenta vinculada. La ves en Perfil → Gestionar cuenta.',
          steam: 'Cuenta de Steam conectada. Ve a Perfil para importar tu biblioteca.',
        };
        const text = redirect.error || SUCCESS[redirect.kind];
        if (text) {
          confirmAction({
            title: redirect.error ? 'No se pudo completar' : 'Listo',
            message: text,
            confirmText: 'Entendido',
            cancelText: 'Cerrar',
            icon: redirect.error ? 'alert-circle' : 'check-circle',
          });
        }
      }
      if (isMounted) setLoading(false);
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

  // Login social: null si el usuario cancela (no cambia nada).
  const loginWithProvider = useCallback(
    async (provider) => {
      const data = await runOAuthFlow(provider);
      if (data) await applySession(data);
      return data;
    },
    [applySession]
  );

  // Vincula un proveedor a la cuenta actual. Devuelve true si se vinculó.
  const linkProvider = useCallback(async (provider) => {
    const data = await runOAuthFlow(provider, { link: true });
    if (!data) return false;
    if (data.user) setUser(data.user);
    return true;
  }, []);

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

  // Datos de la cuenta: el backend devuelve el usuario actualizado.
  const updateName = useCallback(async (name) => {
    const data = await authApi.updateProfile(name);
    if (!data || !data.user) throw new Error('Respuesta inesperada del servidor');
    setUser(data.user);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const data = await authApi.changePassword(currentPassword, newPassword);
    if (!data || !data.user) throw new Error('Respuesta inesperada del servidor');
    setUser(data.user);
  }, []);

  // Elimina la cuenta, borra sus datos locales y cierra la sesión.
  const deleteAccount = useCallback(
    async (password) => {
      const userId = user?.id;
      await authApi.deleteAccount(password);
      await clearUserData(userId);
      await clearSession();
    },
    [user?.id, clearSession]
  );

  // Valor memorizado: evita volver a dibujar todos los consumidores en cada render.
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateAvatar,
      removeAvatar,
      updateName,
      changePassword,
      deleteAccount,
      loginWithProvider,
      linkProvider,
    }),
    [
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateAvatar,
      removeAvatar,
      updateName,
      changePassword,
      deleteAccount,
      loginWithProvider,
      linkProvider,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
