// src/hooks/useGridColumns.js
// Numero de columnas de la cuadricula segun el ancho de la ventana.
import { useWindowDimensions } from 'react-native';

export function useGridColumns() {
  const { width } = useWindowDimensions();

  if (width < 600) return 2;
  if (width < 900) return 3;
  return 4;
}

export default useGridColumns;