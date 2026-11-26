// src/hooks/useSteam.js
// Estado de la cuenta de Steam: conectar, desconectar y sincronizar la biblioteca por lotes.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSteamStatus, unlinkSteam, startSteamSync, nextSteamSync } from '../services/steamApi';
import { runSteamLinkFlow } from '../services/socialAuth';
import { confirmAction } from '../utils/confirm';
import { useLibrary } from './useLibrary';
import { createLogger } from '../utils/logger';

const log = createLogger('steam');

// Fallos pasajeros de un lote: se reintenta el mismo lote.
const MAX_RETRIES = 2;
const isTransient = (err) => err.code === 'NETWORK_ERROR' || err.status >= 500;

export function useSteam() {
  const { refresh: refreshLibrary } = useLibrary();
  const [status, setStatus] = useState(null); // null mientras carga
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(null); // 'link' | 'unlink' | 'sync'
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null); // { type, text }
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getSteamStatus();
      if (mounted.current) {
        setStatus(data);
        setLoadError(null);
      }
    } catch (err) {
      log.info('No se pudo cargar el estado de Steam', { error: err.message });
      if (mounted.current) setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const link = useCallback(async () => {
    setBusy('link');
    setMessage(null);
    try {
      const data = await runSteamLinkFlow();
      if (data && mounted.current) {
        setStatus(data);
        setMessage({ type: 'success', text: 'Cuenta de Steam conectada. Ya puedes sincronizar.' });
      }
    } catch (err) {
      if (mounted.current) setMessage({ type: 'error', text: err.message });
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, []);

  const unlink = useCallback(async () => {
    const confirmed = await confirmAction({
      title: 'Desconectar Steam',
      message: 'Los juegos ya importados se quedan en tu biblioteca.',
      confirmText: 'Desconectar',
      cancelText: 'Cancelar',
      destructive: true,
      icon: 'link-2',
    });
    if (!confirmed) return;
    setBusy('unlink');
    setMessage(null);
    try {
      const data = await unlinkSteam();
      if (mounted.current) {
        setStatus(data);
        setResult(null);
        setProgress(null);
      }
    } catch (err) {
      if (mounted.current) setMessage({ type: 'error', text: err.message });
    } finally {
      if (mounted.current) setBusy(null);
    }
  }, []);

  const nextBatch = useCallback(async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await nextSteamSync();
      } catch (err) {
        if (attempt >= MAX_RETRIES || !isTransient(err)) throw err;
      }
    }
  }, []);

  const sync = useCallback(async () => {
    setBusy('sync');
    setMessage(null);
    setResult(null);
    try {
      let data = await startSteamSync();
      if (mounted.current) setProgress(data.sync);
      while (!data.sync.done && mounted.current) {
        data = await nextBatch();
        if (mounted.current) setProgress(data.sync);
      }
      if (!mounted.current) return;
      setResult(data.sync);
      await Promise.all([refreshLibrary(), load()]);
    } catch (err) {
      if (mounted.current) setMessage({ type: 'error', text: err.message });
    } finally {
      if (mounted.current) {
        setBusy(null);
        setProgress(null);
      }
    }
  }, [load, nextBatch, refreshLibrary]);

  return { status, loadError, busy, progress, result, message, reload: load, link, unlink, sync };
}

export default useSteam;
