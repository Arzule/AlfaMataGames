// Ubicacion del usuario: guarda la ciudad (geocodificacion inversa) y la borra.
const pool = require('../config/db');
const geocode = require('../services/geocode.service');
const { publicUser, findUser } = require('../utils/users');

// Redondea a 2 decimales (unos 1,1 km): nunca se guarda la posicion exacta.
const round2 = (value) => Math.round(value * 100) / 100;

function validCoordinate(value, limit) {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;
}

function userGone(res) {
  return res.status(401).json({ message: 'Usuario no encontrado', code: 'TOKEN_INVALID' });
}

// PUT /auth/me/location (requiere token) — body: { latitude, longitude }
async function updateLocation(req, res, next) {
  try {
    const { latitude, longitude } = req.body || {};
    if (!validCoordinate(latitude, 90) || !validCoordinate(longitude, 180)) {
      return res.status(400).json({ message: 'Coordenadas no válidas.' });
    }
    const lat = round2(latitude);
    const lng = round2(longitude);
    let place;
    try {
      place = await geocode.reverse(lat, lng);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ message: err.message });
      throw err;
    }
    await pool.query(
      `UPDATE users SET city = ?, country = ?, location_lat = ?, location_lng = ?,
         location_updated_at = UTC_TIMESTAMP() WHERE id = ?`,
      [place.city, place.country, lat, lng, req.userId]
    );
    const user = await findUser(req.userId);
    if (!user) return userGone(res);
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

// DELETE /auth/me/location (requiere token)
async function deleteLocation(req, res, next) {
  try {
    await pool.query(
      `UPDATE users SET city = NULL, country = NULL, location_lat = NULL, location_lng = NULL,
         location_updated_at = NULL WHERE id = ?`,
      [req.userId]
    );
    const user = await findUser(req.userId);
    if (!user) return userGone(res);
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { updateLocation, deleteLocation };
