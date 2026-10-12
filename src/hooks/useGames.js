// src/hooks/useGames.js
// Catálogo de RAWG con búsqueda, paginación y protección ante respuestas obsoletas.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGames } from '../services/rawgApi';
import { mapRawgGame } from '../utils/mapGame';

const PAGE_SIZE = 20;

export function useGames({ search = '' } = {}) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Identifica la petición vigente; las respuestas viejas se descartan.
  const requestIdRef = useRef(0);
  const pageRef = useRef(1);

  // Reinicia la lista y carga la página 1 con el término actual.
  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    pageRef.current = 1;
    setLoading(true);
    setError(null);

    try {
      const data = await getGames({ search, page: 1, pageSize: PAGE_SIZE });
      if (requestId !== requestIdRef.current) return;
      setGames(data.results.map(mapRawgGame));
      setHasMore(data.hasMore);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError('No se pudieron cargar los juegos. Verifica tu conexión.');
        setGames([]);
        setHasMore(false);
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

  return { games, loading, loadingMore, error, hasMore, loadMore, reload };
}

export default useGames;
