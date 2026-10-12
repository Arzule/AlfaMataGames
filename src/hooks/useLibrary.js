// src/hooks/useLibrary.js
// Hook para consumir el contexto de la biblioteca.
import { useContext } from 'react';
import { LibraryContext } from '../context/LibraryContext';

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary debe usarse dentro de LibraryProvider');
  }
  return context;
}

export default useLibrary;
