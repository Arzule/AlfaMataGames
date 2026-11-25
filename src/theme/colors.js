// src/theme/colors.js
export const colors = {
  background: '#0f0f14',
  surface: '#1a1a22',
  border: '#222230',
  primary: '#8b5cf6',
  // Texto y enlaces violetas: primary no llega a 4.5:1 sobre surface (WCAG AA).
  primaryText: '#a78bfa',
  textPrimary: '#ffffff',
  textSecondary: '#9e9eaf',
  // Texto secundario sobre imágenes (banner de fondo del detalle en web).
  textOnImage: '#e4e4ec',
  textMuted: '#85859b', // 4.8:1 sobre surface (antes #65657a, 3:1)
  success: '#10b981',
  successBg: 'rgba(16, 185, 129, 0.13)',
  warning: '#f5a623',
  warningBg: 'rgba(245, 166, 35, 0.13)',
  info: '#3b82f6',
  infoBg: 'rgba(59, 130, 246, 0.13)',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.13)',
  primaryBg: 'rgba(139, 92, 246, 0.15)',
  badgeNeutral: '#262630',
  // Desvanecido del banner hacia el fondo (background con 35% y 80% de opacidad).
  backgroundFadeSoft: 'rgba(15, 15, 20, 0.35)',
  backgroundFadeStrong: 'rgba(15, 15, 20, 0.8)',
  overlay: 'rgba(16, 16, 24, 0.6)',
};
