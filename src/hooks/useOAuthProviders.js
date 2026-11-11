// src/hooks/useOAuthProviders.js
// Proveedores de login social configurados en el backend (sin ellos no se muestran botones).
import { useEffect, useState } from 'react';
import { getProviders } from '../services/oauthApi';
import { createLogger } from '../utils/logger';

const log = createLogger('oauth');

export function useOAuthProviders() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    let active = true;
    getProviders()
      .then((data) => {
        if (active && Array.isArray(data?.providers)) setProviders(data.providers);
      })
      .catch((err) => log.info('No se pudieron leer los proveedores de login social', err));
    return () => {
      active = false;
    };
  }, []);

  return providers;
}
