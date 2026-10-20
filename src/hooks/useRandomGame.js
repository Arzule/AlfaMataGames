// src/hooks/useRandomGame.js
// Busca un juego al azar en RAWG; evita búsquedas simultáneas y expone el error.
import { useCallback, useRef, useState } from 'react';
import { getRandomGame } from '../services/rawgApi';

export function useRandomGame() {
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);

  // Devuelve el id del juego, o null si falló o ya había una búsqueda en curso.
  const discover = useCallback(async () => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setDiscovering(true);
    setError(null);
    try {
      const game = await getRandomGame();
      return game.id;
    } catch (err) {
      setError('No se pudo obtener un juego al azar.');
      return null;
    } finally {
      busyRef.current = false;
      setDiscovering(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { discovering, error, discover, clearError };
}

export default useRandomGame;
