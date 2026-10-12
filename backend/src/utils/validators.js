// Validaciones manuales (sin librerías externas).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUSES = ['Jugando', 'Completado', 'Pendiente', 'Abandonado'];

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

module.exports = { isValidEmail, validateRegister, validateLogin, STATUSES };
