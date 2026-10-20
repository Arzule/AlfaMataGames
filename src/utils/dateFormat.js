// src/utils/dateFormat.js
// Formato de fechas y horas en la hora local, sin depender de Intl.

const pad = (n) => String(n).padStart(2, '0');

function toDate(value) {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

// "dd/mm/aaaa"; vacío si la fecha no es válida.
export function formatDate(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// "HH:MM" a partir de hora y minuto.
export function formatTime(hour, minute) {
  return `${pad(hour)}:${pad(minute)}`;
}

// "dd/mm/aaaa a las HH:MM"; vacío si la fecha no es válida.
export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${formatDate(date)} a las ${formatTime(date.getHours(), date.getMinutes())}`;
}
