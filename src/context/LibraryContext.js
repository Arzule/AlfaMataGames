// src/context/LibraryContext.js
// Biblioteca del usuario autenticado: favoritos, estado, puntuación y reseña.
// Se carga por usuario y se limpia al cerrar sesión.
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as libraryApi from '../services/libraryApi';
import { useAuth } from '../hooks/useAuth';

export const LibraryContext = createContext(null);

// ¿La entrada quedó vacía (sin favorito, estado, puntuación ni reseña)?
function isEmpty(entry) {
  return (
    !entry.isFavorite &&
    !entry.status &&
    (entry.userScore === null || entry.userScore === undefined) &&
    !entry.review
  );
}

export function LibraryProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Referencia siempre actualizada para revertir cambios optimistas.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Contador de peticiones: descarta respuestas obsoletas (lentas).
  const requestIdRef = useRef(0);

  // Pide GET /library con loading/error. Reutilizable por el efecto y refresh().
  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await libraryApi.getLibrary();
      if (requestId !== requestIdRef.current) return;
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError('No se pudo cargar tu biblioteca.');
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Carga la biblioteca cuando cambia el usuario; se limpia sin sesión.
  useEffect(() => {
    if (!userId) {
      // Invalida cualquier petición en curso y vacía el estado.
      requestIdRef.current += 1;
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    load();
  }, [userId, load]);

  // Vuelve a pedir la biblioteca (usado por pull-to-refresh y "Reintentar").
  const refresh = useCallback(async () => {
    if (!userId) return;
    await load();
  }, [userId, load]);

  // Índice por gameId: cada tarjeta del catálogo consulta su estado sin recorrer la lista.
  const entriesById = useMemo(
    () => new Map(items.map((item) => [item.gameId, item])),
    [items]
  );

  // Devuelve la entrada guardada de un juego (o undefined).
  const getEntry = useCallback(
    (gameId) => entriesById.get(Number(gameId)),
    [entriesById]
  );

  // ¿El juego está marcado como favorito?
  const isFavorite = useCallback(
    (gameId) => Boolean(getEntry(gameId)?.isFavorite),
    [getEntry]
  );

  // Elimina una entrada, con reversión si el backend falla.
  const removeEntry = useCallback(async (gameId) => {
    const id = Number(gameId);
    const previous = itemsRef.current;

    setItems((current) => current.filter((item) => item.gameId !== id));
    setError(null);

    try {
      await libraryApi.deleteEntry(id);
    } catch (err) {
      setItems(previous);
      setError('No se pudo eliminar de tu biblioteca.');
      throw err;
    }
  }, []);

  // Guarda cambios de una entrada de forma optimista.
  // game = { id, name, image, rating } (resumen para el primer guardado).
  const saveEntry = useCallback(
    async (game, patch = {}) => {
      const gameId = Number(game.id);
      const previous = itemsRef.current;
      const prev = previous.find((item) => item.gameId === gameId) || null;

      // Combinar con lo que ya existía para saber cómo queda la entrada.
      const merged = {
        isFavorite:
          patch.isFavorite !== undefined ? !!patch.isFavorite : prev?.isFavorite ?? false,
        status: patch.status !== undefined ? patch.status : prev?.status ?? null,
        userScore:
          patch.userScore !== undefined ? patch.userScore : prev?.userScore ?? null,
        review: patch.review !== undefined ? patch.review : prev?.review ?? null,
      };

      // Si queda completamente vacía, se borra.
      if (isEmpty(merged)) {
        await removeEntry(gameId);
        return null;
      }

      const optimistic = {
        gameId,
        name: game.name,
        image: game.image ?? null,
        rating: game.rating ?? null,
        ...merged,
      };

      // Cambio optimista inmediato.
      setItems((current) => {
        const exists = current.some((item) => item.gameId === gameId);
        return exists
          ? current.map((item) => (item.gameId === gameId ? optimistic : item))
          : [optimistic, ...current];
      });
      setError(null);

      try {
        // Para crear se envía el resumen; para actualizar, solo el patch.
        const body = prev
          ? { ...patch }
          : {
              name: game.name,
              image: game.image ?? null,
              rating: game.rating ?? null,
              ...patch,
            };
        const data = await libraryApi.saveEntry(gameId, body);
        const entry = data?.entry ?? null;

        // Conciliar con la respuesta del backend.
        if (entry) {
          setItems((current) => {
            const exists = current.some((item) => item.gameId === gameId);
            return exists
              ? current.map((item) => (item.gameId === gameId ? entry : item))
              : [entry, ...current];
          });
        }
        return entry;
      } catch (err) {
        setItems(previous);
        setError('No se pudo guardar el cambio.');
        throw err;
      }
    },
    [removeEntry]
  );

  // Valor memorizado: los consumidores solo se vuelven a dibujar cuando algo cambia.
  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      getEntry,
      isFavorite,
      saveEntry,
      removeEntry,
      refresh,
    }),
    [items, loading, error, getEntry, isFavorite, saveEntry, removeEntry, refresh]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
