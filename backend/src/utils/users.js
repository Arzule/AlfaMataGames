// Utilidades de usuario compartidas por auth y oauth: token, usuario público y lectura.
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Columnas para armar el usuario público (password_hash solo se usa para hasPassword).
const USER_COLUMNS =
  'id, name, email, avatar, password_hash, city, country, location_lat, location_lng';

// Firma un token con el id del usuario.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Devuelve solo los campos públicos del usuario. hasPassword indica si la cuenta tiene
// contraseña propia (las creadas con Google o Discord no).
function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? null,
    hasPassword: Boolean(row.password_hash),
    // Ciudad del Perfil (coordenadas redondeadas a 2 decimales) o null.
    location: row.city
      ? {
          city: row.city,
          country: row.country ?? null,
          latitude: row.location_lat === null ? null : Number(row.location_lat),
          longitude: row.location_lng === null ? null : Number(row.location_lng),
        }
      : null,
  };
}

// Lee el usuario por id (o null si ya no existe).
async function findUser(userId) {
  const [rows] = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [userId]);
  return rows[0] || null;
}

module.exports = { USER_COLUMNS, signToken, publicUser, findUser };
