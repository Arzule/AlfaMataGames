// src/hooks/useGameDescription.js
// Sinopsis traducida de un juego (backend: RAWG + DeepL con caché).
// Si el backend no responde, se usa la descripción original que la app ya tiene de RAWG
// (fallbackText) con el aviso 'unavailable'; la sinopsis nunca queda vacía por un error.
import { useEffect, useRef, useState } from 'react';
import { getGameDescription } from '../services/gamesApi';
import { createLogger } from '../utils/logger';

const log = createLogger('sinopsis');

export function useGameDescription(gameId, fallbackText) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setData(null);
    setFailed(false);
    setLoading(true);
    getGameDescription(gameId)
      .then((result) => {
        if (requestId === requestIdRef.current) setData(result);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        log.info('Sin sinopsis del backend; se usa la de RAWG', err);
        setFailed(true);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
    return () => {
      requestIdRef.current += 1;
    };
  }, [gameId]);

  const fallback = (fallbackText ?? '').trim();

  if (data && !failed) {
    return {
      loading,
      text: data.text ?? '',
      original: data.original ?? '',
      translated: Boolean(data.translated),
      notice: data.notice ?? null,
    };
  }
  return {
    loading,
    text: fallback,
    original: fallback,
    translated: false,
    // Mientras carga no hay aviso; si falló, el texto es el original sin traducir.
    notice: loading ? null : fallback ? 'unavailable' : 'empty',
  };
}

export default useGameDescription;
