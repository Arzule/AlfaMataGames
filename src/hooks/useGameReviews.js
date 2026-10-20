// src/hooks/useGameReviews.js
// Reseñas de la comunidad de un juego, paginadas ("Ver más").
import { useCallback, useEffect, useRef, useState } from 'react';
import { getGameReviews } from '../services/reviewsApi';

const PAGE_SIZE = 10;

export function useGameReviews(gameId) {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // Evita aplicar respuestas de un juego anterior o de una recarga ya reemplazada.
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(
    async (nextPage) => {
      const requestId = ++requestIdRef.current;
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const data = await getGameReviews(gameId, { page: nextPage, pageSize: PAGE_SIZE });
        if (requestId !== requestIdRef.current) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setReviews((current) => (nextPage === 1 ? items : [...current, ...items]));
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(
          nextPage === 1
            ? 'No se pudieron cargar las reseñas.'
            : 'No se pudieron cargar más reseñas.'
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [gameId]
  );

  useEffect(() => {
    setReviews([]);
    setHasMore(false);
    fetchPage(1);
    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) fetchPage(page + 1);
  }, [loading, loadingMore, hasMore, page, fetchPage]);

  const reload = useCallback(() => fetchPage(1), [fetchPage]);

  return { reviews, loading, loadingMore, error, hasMore, loadMore, reload };
}

export default useGameReviews;
