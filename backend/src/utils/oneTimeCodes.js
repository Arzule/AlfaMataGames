// Códigos de un solo uso con PKCE para volver del navegador a la app (login social y Steam).
// El deep link solo lleva el código; para canjearlo hay que enviar el secreto (codeVerifier)
// cuyo SHA-256 (codeChallenge) mandó la app al empezar. Viven en memoria y duran 2 minutos.
const crypto = require('crypto');

const CODE_TTL_MS = 2 * 60 * 1000;
const CHALLENGE_REGEX = /^[A-Za-z0-9_-]{43}$/;
const VERIFIER_REGEX = /^[A-Za-z0-9_-]{43,128}$/;

const pending = new Map();

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const isValidChallenge = (value) => typeof value === 'string' && CHALLENGE_REGEX.test(value);

// Guarda el payload (debe incluir `challenge`) y devuelve el código para el deep link.
function create(payload) {
  const now = Date.now();
  for (const [key, value] of pending) {
    if (value.expiresAt <= now) pending.delete(key);
  }
  const code = base64url(crypto.randomBytes(32));
  pending.set(code, { ...payload, expiresAt: now + CODE_TTL_MS });
  return code;
}

// Canjea el código (un solo intento). Devuelve { payload } o { error: 'CODE_EXPIRED' |
// 'INVALID_VERIFIER' }.
function consume(code, codeVerifier) {
  const entry = typeof code === 'string' ? pending.get(code) : null;
  if (entry) pending.delete(code);
  if (!entry || entry.expiresAt <= Date.now()) return { error: 'CODE_EXPIRED' };
  if (typeof codeVerifier !== 'string' || !VERIFIER_REGEX.test(codeVerifier)) {
    return { error: 'INVALID_VERIFIER' };
  }
  const expected = Buffer.from(entry.challenge);
  const actual = Buffer.from(base64url(crypto.createHash('sha256').update(codeVerifier).digest()));
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return { error: 'INVALID_VERIFIER' };
  }
  return { payload: entry };
}

module.exports = { create, consume, isValidChallenge };
