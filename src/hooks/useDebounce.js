// src/hooks/useDebounce.js
// Devuelve el valor retrasado `delay` ms tras el último cambio.
import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
