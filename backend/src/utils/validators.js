// Validaciones manuales (sin librerías externas).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = ['Jugando', 'Completado', 'Pendiente', 'Abandonado'];
// Longitud máxima permitida para la reseña de un juego.
const REVIEW_MAX_LENGTH = 1000;
// Tamaño máximo de la foto de perfil ya decodificada (la app envía ~256x256 JPEG).
const AVATAR_MAX_BYTES = 200 * 1024;
const AVATAR_DATA_URI = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

// Firma (primeros bytes) de cada formato permitido.
const IMAGE_SIGNATURES = {
  'image/jpeg': (buf) => buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  'image/png': (buf) =>
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
  'image/webp': (buf) =>
    buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP',
};

// Verifica un correo con formato básico válido.
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

// Valida los datos de registro y los normaliza.
function validateRegister(body = {}) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 80) {
    errors.push('El nombre debe tener entre 2 y 80 caracteres.');
  }
  if (!isValidEmail(email)) {
    errors.push('El correo no es válido.');
  }
  if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres.');
  }

  return { errors, data: { name, email, password } };
}

// Valida los datos de login.
function validateLogin(body = {}) {
  const errors = [];
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!isValidEmail(email)) {
    errors.push('El correo no es válido.');
  }
  if (!password) {
    errors.push('La contraseña es obligatoria.');
  }

  return { errors, data: { email, password } };
}

// Valida la foto de perfil: data URI base64 de JPEG, PNG o WebP de hasta AVATAR_MAX_BYTES.
// Comprueba el contenido real (firma del archivo), no solo el tipo declarado.
function validateAvatar(image) {
  if (typeof image !== 'string') {
    return { error: 'Falta la imagen.' };
  }
  const match = AVATAR_DATA_URI.exec(image);
  if (!match || match[2].length % 4 !== 0) {
    return { error: 'Formato de imagen no válido. Usa JPEG, PNG o WebP.' };
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > AVATAR_MAX_BYTES) {
    return { error: 'La imagen supera el tamaño máximo de 200 KB.' };
  }
  if (buffer.length < 12 || !IMAGE_SIGNATURES[mimeType](buffer)) {
    return { error: 'El archivo no es una imagen válida.' };
  }

  return { error: null, dataUri: image };
}

module.exports = {
  isValidEmail,
  validateRegister,
  validateLogin,
  validateAvatar,
  STATUSES,
  REVIEW_MAX_LENGTH,
  AVATAR_MAX_BYTES,
};
