// Geocodificacion inversa con Nominatim (OpenStreetMap): coordenadas -> ciudad y pais.
// Sin clave. Politica de uso: User-Agent propio, maximo 1 peticion por segundo y atribucion.
const { createLogger } = require('../utils/logger');

const log = createLogger('geocode');

const TIMEOUT_MS = 8000;
const BASE_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'AlfaMataGames/1.0 (proyecto academico)';
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

function geocodeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Espera lo necesario para no pasar de 1 peticion por segundo.
async function throttle() {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  lastRequestAt = Date.now() + Math.max(wait, 0);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

// El nombre de la localidad viene en campos distintos segun el tamano del lugar.
const CITY_FIELDS = ['city', 'town', 'village', 'municipality', 'county', 'state_district', 'state'];

// Devuelve { city, country } o lanza un error con status (404 sin localidad, 503 sin servicio).
async function reverse(latitude, longitude) {
  await throttle();
  const url =
    `${BASE_URL}/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=es` +
    `&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    log.warn('Nominatim no respondio', { error: err.name });
    throw geocodeError(503, 'No se pudo consultar la ciudad. Intenta más tarde.');
  }
  if (!response.ok) {
    log.warn('Nominatim respondio con error', { status: response.status });
    throw geocodeError(503, 'No se pudo consultar la ciudad. Intenta más tarde.');
  }
  const data = await response.json();
  const address = data?.address || {};
  const city = CITY_FIELDS.map((field) => address[field]).find(Boolean);
  if (!city) {
    throw geocodeError(404, 'No se encontró una ciudad para tu ubicación.');
  }
  return { city: String(city).slice(0, 120), country: address.country ? String(address.country).slice(0, 80) : null };
}

module.exports = { reverse };
