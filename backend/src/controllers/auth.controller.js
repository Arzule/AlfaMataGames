// Controladores de autenticación: registro, login y datos del usuario.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { validateRegister, validateLogin, validateAvatar } = require('../utils/validators');

// Firma un token con el id del usuario.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Devuelve solo los campos públicos del usuario.
function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, avatar: row.avatar ?? null };
}

// POST /auth/register
async function register(req, res, next) {
  try {
    const { errors, data } = validateRegister(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [
      data.email,
    ]);
    if (existing.length) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [data.name, data.email, passwordHash]
    );

    const user = { id: result.insertId, name: data.name, email: data.email, avatar: null };
    return res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    return next(err);
  }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { errors, data } = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, password_hash FROM users WHERE email = ?',
      [data.email]
    );
    const user = rows[0];

    // Mensaje genérico para no revelar si el correo existe.
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Correo o contraseña incorrectos' });
    }

    const matches = await bcrypt.compare(data.password, user.password_hash);
    if (!matches) {
      return res
        .status(401)
        .json({ message: 'Correo o contraseña incorrectos' });
    }

    return res.json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// GET /auth/me (requiere token)
async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar FROM users WHERE id = ?',
      [req.userId]
    );
    if (!rows.length) {
      return res
        .status(401)
        .json({ message: 'Usuario no encontrado', code: 'TOKEN_INVALID' });
    }
    return res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    return next(err);
  }
}

// Guarda (o borra con null) la foto y devuelve el usuario actualizado.
async function saveAvatar(userId, avatar) {
  await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);
  const [rows] = await pool.query('SELECT id, name, email, avatar FROM users WHERE id = ?', [
    userId,
  ]);
  return rows[0] || null;
}

// PUT /auth/me/avatar (requiere token) — body: { image: 'data:image/jpeg;base64,...' }
async function updateAvatar(req, res, next) {
  try {
    const { error, dataUri } = validateAvatar(req.body?.image);
    if (error) {
      return res.status(400).json({ message: error });
    }
    const user = await saveAvatar(req.userId, dataUri);
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Usuario no encontrado', code: 'TOKEN_INVALID' });
    }
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// DELETE /auth/me/avatar (requiere token)
async function deleteAvatar(req, res, next) {
  try {
    const user = await saveAvatar(req.userId, null);
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Usuario no encontrado', code: 'TOKEN_INVALID' });
    }
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me, updateAvatar, deleteAvatar };
