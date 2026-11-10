// Controladores de autenticación: registro, login y datos del usuario.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const {
  validateRegister,
  validateLogin,
  validateProfile,
  validatePasswordChange,
  validateAvatar,
} = require('../utils/validators');

// Columnas para armar el usuario público (password_hash solo se usa para hasPassword).
const USER_COLUMNS = 'id, name, email, avatar, password_hash';

// Firma un token con el id del usuario.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Devuelve solo los campos públicos del usuario. hasPassword indica si la cuenta tiene
// contraseña propia (las cuentas de Google/Discord no, desde A4-4).
function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? null,
    hasPassword: Boolean(row.password_hash),
  };
}

// Lee el usuario por id (o null si ya no existe).
async function findUser(userId) {
  const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [userId]);
  return rows[0] || null;
}

// Respuesta cuando el token es válido pero el usuario ya no existe.
function userGone(res) {
  return res.status(401).json({ message: 'Usuario no encontrado', code: 'TOKEN_INVALID' });
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

    const user = publicUser({
      id: result.insertId,
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
    });
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

    const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`, [
      data.email,
    ]);
    const user = rows[0];

    // Mensaje genérico para no revelar si el correo existe.
    // Sin contraseña (cuenta social) se trata igual que un correo inexistente.
    if (!user || !user.password_hash) {
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
    const user = await findUser(req.userId);
    if (!user) return userGone(res);
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// Guarda (o borra con null) la foto y devuelve el usuario actualizado.
async function saveAvatar(userId, avatar) {
  await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);
  return findUser(userId);
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

// PUT /auth/me (requiere token) — body: { name }
async function updateProfile(req, res, next) {
  try {
    const { errors, data } = validateProfile(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }
    const [result] = await pool.query('UPDATE users SET name = ? WHERE id = ?', [
      data.name,
      req.userId,
    ]);
    if (!result.affectedRows) return userGone(res);
    return res.json({ user: publicUser(await findUser(req.userId)) });
  } catch (err) {
    return next(err);
  }
}

// PUT /auth/me/password (requiere token) — body: { currentPassword, newPassword }
// La contraseña actual incorrecta responde 400 (no 401: la sesión sigue siendo válida).
async function changePassword(req, res, next) {
  try {
    const user = await findUser(req.userId);
    if (!user) return userGone(res);
    if (!user.password_hash) {
      return res
        .status(400)
        .json({ message: 'Tu cuenta no usa contraseña.', code: 'NO_PASSWORD' });
    }

    const { errors, data } = validatePasswordChange(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }
    const matches = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!matches) {
      return res
        .status(400)
        .json({ message: 'La contraseña actual no es correcta.', code: 'WRONG_PASSWORD' });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      req.userId,
    ]);
    return res.json({ user: publicUser({ ...user, password_hash: passwordHash }) });
  } catch (err) {
    return next(err);
  }
}

// DELETE /auth/me (requiere token) — body: { password } si la cuenta tiene contraseña.
// La biblioteca se borra en cascada (FK de user_games con ON DELETE CASCADE).
async function deleteAccount(req, res, next) {
  try {
    const user = await findUser(req.userId);
    if (!user) return userGone(res);
    if (user.password_hash) {
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!password) {
        return res.status(400).json({ message: 'Escribe tu contraseña para confirmar.' });
      }
      const matches = await bcrypt.compare(password, user.password_hash);
      if (!matches) {
        return res
          .status(400)
          .json({ message: 'La contraseña no es correcta.', code: 'WRONG_PASSWORD' });
      }
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.userId]);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  deleteAccount,
  updateAvatar,
  deleteAvatar,
};
