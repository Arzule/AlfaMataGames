// src/hooks/useGames.js
// Catálogo de RAWG con búsqueda, paginación y protección ante respuestas obsoletas.
// La primera página sin búsqueda se guarda en caché: se muestra mientras carga y sin red.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGames } from '../services/rawgApi';
import { mapRawgGame } from '../utils/mapGame';
import { readCatalogCache, writeCatalogCache } from '../services/catalogCache';

const PAGE_SIZE = 20;

export function useGames({ search = '' } = {}) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  // true si la red falló y se muestran los datos guardados.
  const [offline, setOffline] = useState(false);

  // Identifica la petición vigente; las respuestas viejas se descartan.
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);

  // Reinicia la lista y carga la página 1 con el término actual.
  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    pageRef.current = 1;
    setLoading(true);
    setError(null);
    setOffline(false);

    // Sin búsqueda: mostrar la caché (si hay) mientras llega la respuesta.
    let cached = null;
    if (!search) {
      cached = await readCatalogCache();
      if (requestId !== requestIdRef.current) return;
      if (cached) {
        setGames(cached.data.games);
        setHasMore(false);
        setLoading(false);
      }
    }

    try {
      const data = await getGames({ search, page: 1, pageSize: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      const mapped = data.results.map(mapRawgGame);
      setGames(mapped);
      setHasMore(data.hasMore);
      if (!search) writeCatalogCache({ games: mapped });
    } catch (err) {
      if (requestId === requestIdRef.current) {
        if (cached) {
          // Se conserva lo guardado y se avisa que no hay conexión.
          setOffline(true);
        } else {
          setError('No se pudieron cargar los juegos. Verifica tu conexión.');
          setGames([]);
          setHasMore(false);
        }
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [search]);

  // Recargar al cambiar el término (ya viene con debounce).
  useEffect(() => {
    reload();
  }, [reload]);

  // Agrega la siguiente página sin duplicar ids.
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    const requestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);

    try {
      const data = await getGames({ search, page: nextPage, pageSize: PAGE_SIZE });
      // Ignorar si el término cambió mientras cargaba.
      if (requestId !== requestIdRef.current) return;
      pageRef.current = nextPage;
      setGames((current) => {
        const seen = new Set(current.map((game) => game.id));
        const merged = [...current];
        data.results.map(mapRawgGame).forEach((game) => {
          if (!seen.has(game.id)) merged.push(game);
        });
        return merged;
      });
      setHasMore(data.hasMore);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError('No se pudieron cargar más juegos.');
      }
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  }, [search, loading, loadingMore, hasMore]);

  return { games, loading, loadingMore, error, hasMore, offline, loadMore, reload };
}

export default useGames;
