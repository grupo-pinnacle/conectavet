/**
 * Centralised theme tokens. Mirrors `apps/web/tailwind.config.js` so the
 * mobile and web apps share the same visual identity. See INTEGRATION.md §1.
 */
export const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  secondary: '#10b981',
  secondaryDark: '#059669',
  accent: '#f59e0b',
  accentDark: '#d97706',
  danger: '#ef4444',
  dangerDark: '#dc2626',
  background: '#f9fafb',
  surface: '#ffffff',
  ink: '#111827',
  inkSoft: '#374151',
  inkMuted: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  card: 12,
  lg: 16,
  pill: 9999,
} as const;

export const fontSizes = {
  body: 14,
  input: 16,
  title: 20,
  hero: 28,
} as const;

export const speciesEmoji: Record<string, string> = {
  DOG: '🐶',
  CAT: '🐱',
  BIRD: '🐦',
  REPTILE: '🦎',
  RODENT: '🐹',
  OTHER: '🐾',
};

export const speciesLabel: Record<string, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  BIRD: 'Ave',
  REPTILE: 'Reptil',
  RODENT: 'Roedor',
  OTHER: 'Otra',
};

export const statusColors: Record<string, string> = {
  WAITING: colors.accent,
  ASSIGNED: colors.primary,
  IN_CONSULTATION: colors.secondary,
  COMPLETED: colors.inkMuted,
  CANCELLED: colors.danger,
};

export const statusLabel: Record<string, string> = {
  WAITING: 'En espera',
  ASSIGNED: 'Asignado',
  IN_CONSULTATION: 'En consulta',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};
