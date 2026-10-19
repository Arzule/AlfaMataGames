// src/utils/avatarImage.js
// Prepara la foto de perfil: recorte cuadrado centrado, 256 px y JPEG comprimido en base64.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const AVATAR_SIZE = 256;
const JPEG_QUALITY = 0.7;

/**
 * @param {{ uri: string, width?: number, height?: number }} asset  imagen elegida
 * @returns {Promise<string>} data URI 'data:image/jpeg;base64,...'
 */
export async function prepareAvatar(asset) {
  const context = ImageManipulator.manipulate(asset.uri);

  // El recorte del sistema ya suele ser cuadrado; si no (p. ej. en web), se centra.
  const { width, height } = asset;
  if (width && height && width !== height) {
    const side = Math.min(width, height);
    context.crop({
      originX: Math.floor((width - side) / 2),
      originY: Math.floor((height - side) / 2),
      width: side,
      height: side,
    });
  }
  context.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE });

  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });
  if (!result.base64) {
    throw new Error('No se pudo procesar la imagen.');
  }
  return `data:image/jpeg;base64,${result.base64}`;
}
