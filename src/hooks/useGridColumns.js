// src/hooks/useGridColumns.js
// Numero de columnas de la cuadricula segun el ancho de la ventana (2 a 6).
import { Platform, useWindowDimensions } from 'react-native';

// Ajustes de FlatList para las grillas de juegos. Con numColumns, los conteos son filas:
// 4 filas cubren la pantalla de un celular; windowSize 7 mantiene montadas ~3 pantallas
// por encima y por debajo (el valor por defecto, 21, retiene muchas portadas en memoria).
// removeClippedSubviews solo en Android: en iOS puede dejar celdas en blanco.
export const GRID_PERFORMANCE_PROPS = {
  initialNumToRender: 4,
  maxToRenderPerBatch: 4,
  updateCellsBatchingPeriod: 50,
  windowSize: 7,
  removeClippedSubviews: Platform.OS === 'android',
};

export function useGridColumns() {
  const { width } = useWindowDimensions();

  if (width < 600) return 2;
  if (width < 900) return 3;
  if (width < 1200) return 4;
  // Pantallas anchas (web): mas columnas para que las portadas no crezcan demasiado.
  if (width < 1500) return 5;
  return 6;
}

export default useGridColumns;
