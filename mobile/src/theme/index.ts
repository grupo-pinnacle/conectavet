import { PixelRatio } from 'react-native';

// ─── Palette ────────────────────────────────────────────────────────────────

export const palette = {
  teal50: '#F0FDFA', teal100: '#CCFBF1', teal200: '#99F6E4', teal300: '#5EEAD4',
  teal400: '#2DD4BF', teal500: '#14B8A6', teal600: '#0D9488', teal700: '#0F766E',
  teal800: '#115E59', teal900: '#134E4A', teal950: '#042F2E',
  slate50: '#F8FAFC', slate100: '#F1F5F9', slate200: '#E2E8F0', slate300: '#CBD5E1',
  slate400: '#94A3B8', slate500: '#64748B', slate600: '#475569', slate700: '#334155',
  slate800: '#1E293B', slate900: '#0F172A', slate950: '#020617',
  amber50: '#FFFBEB', amber100: '#FEF3C7', amber200: '#FDE68A', amber300: '#FCD34D',
  amber400: '#FBBF24', amber500: '#F59E0B', amber600: '#D97706', amber700: '#B45309',
  amber800: '#92400E', amber900: '#78350F',
  red50: '#FEF2F2', red100: '#FEE2E2', red200: '#FECACA', red300: '#FCA5A5',
  red400: '#F87171', red500: '#EF4444', red600: '#DC2626', red700: '#B91C1C',
  red800: '#991B1B', red900: '#7F1D1D',
  green50: '#F0FDF4', green100: '#DCFCE7', green200: '#BBF7D0', green300: '#86EFAC',
  green400: '#4ADE80', green500: '#22C55E', green600: '#16A34A', green700: '#15803D',
  green800: '#166534', green900: '#14532D',
  white: '#FFFFFF', black: '#000000',
} as const;

/** Responsive font size: scales with system Dynamic Type / Accessibility font size */
export function rf(size: number): number {
  return PixelRatio.roundToNearestPixel(size * PixelRatio.getFontScale());
}

// ─── Color Schemes ──────────────────────────────────────────────────────────

export interface ColorScheme {
  primary: string; primaryDark: string; primaryLight: string; primaryBg: string;
  secondary: string; secondaryDark: string; secondaryLight: string; secondaryBg: string;
  accent: string; accentDark: string; accentLight: string; accentBg: string;
  danger: string; dangerDark: string; dangerLight: string; dangerBg: string;
  success: string; successDark: string; successLight: string; successBg: string;
  background: string; surface: string; surfaceElevated: string;
  ink: string; inkSoft: string; inkMuted: string;
  border: string; borderLight: string; overlay: string;
  white: string; black: string;
}

export const lightColors: ColorScheme = {
  primary: '#0F766E', primaryDark: '#115E59', primaryLight: '#14B8A6', primaryBg: '#F0FDFA',
  secondary: '#475569', secondaryDark: '#334155', secondaryLight: '#64748B', secondaryBg: '#F1F5F9',
  accent: '#F59E0B', accentDark: '#D97706', accentLight: '#FDE68A', accentBg: '#FFFBEB',
  danger: '#EF4444', dangerDark: '#DC2626', dangerLight: '#FECACA', dangerBg: '#FEF2F2',
  success: '#16A34A', successDark: '#15803D', successLight: '#BBF7D0', successBg: '#F0FDF4',
  background: '#F8FAFC', surface: '#FFFFFF', surfaceElevated: '#FFFFFF',
  ink: '#0F172A', inkSoft: '#334155', inkMuted: '#64748B',
  border: '#E2E8F0', borderLight: '#F1F5F9', overlay: 'rgba(15,23,42,0.5)',
  white: '#FFFFFF', black: '#000000',
};

export const darkColors: ColorScheme = {
  primary: '#2DD4BF', primaryDark: '#5EEAD4', primaryLight: '#14B8A6', primaryBg: '#042F2E',
  secondary: '#64748B', secondaryDark: '#94A3B8', secondaryLight: '#475569', secondaryBg: '#1E293B',
  accent: '#FBBF24', accentDark: '#FDE68A', accentLight: '#D97706', accentBg: '#78350F',
  danger: '#F87171', dangerDark: '#FCA5A5', dangerLight: '#DC2626', dangerBg: 'rgba(239,68,68,0.15)',
  success: '#4ADE80', successDark: '#86EFAC', successLight: '#16A34A', successBg: 'rgba(22,163,74,0.15)',
  background: '#020617', surface: '#0F172A', surfaceElevated: '#1E293B',
  ink: '#F8FAFC', inkSoft: '#E2E8F0', inkMuted: '#64748B',
  border: '#334155', borderLight: '#1E293B', overlay: 'rgba(2,6,23,0.7)',
  white: '#FFFFFF', black: '#000000',
};

// ─── Design Tokens ──────────────────────────────────────────────────────────

export const spacing = { px: 1, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40, massive: 48 } as const;
export const radius = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, full: 9999 } as const;
export const fontSizes = { caption: 12, label: 13, body: 14, bodyLarge: 15, input: 16, subtitle: 18, title: 20, heading: 24, hero: 32, display: 40 } as const;
export const letterSpacings = { tight: -0.5, snug: -0.3, normal: 0, wide: 0.1, wider: 0.15, widest: 0.2 } as const;
export const borderWidths = { none: 0, thin: 1, normal: 1.5, thick: 2 } as const;
export const fontWeights = { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const, extrabold: '800' as const };
export const lineHeights = { tight: 1.15, normal: 1.4, relaxed: 1.6 };

export const shadows = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  subtle: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  raised: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  overlay: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  modal: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
};

export const motion = {
  duration: { instant: 100, fast: 200, normal: 300, slow: 400, deliberate: 600 },
  spring: { damping: 20, stiffness: 200, mass: 1 },
  springGentle: { damping: 25, stiffness: 150, mass: 1 },
  springSnappy: { damping: 15, stiffness: 300, mass: 0.5 },
};

export const opacity = { disabled: 0.45, pressed: 0.85, muted: 0.6, subtle: 0.15, invisible: 0, visible: 1 };

// ─── Species Helpers ─────────────────────────────────────────────────────────

export const speciesIcon: Record<string, string> = {
  DOG: 'dog', CAT: 'cat', BIRD: 'bird', REPTILE: 'lizard', RODENT: 'rodent', OTHER: 'paw',
};

export const speciesLabel: Record<string, string> = {
  DOG: 'Perro', CAT: 'Gato', BIRD: 'Ave', REPTILE: 'Reptil', RODENT: 'Roedor', OTHER: 'Otra',
};

// ─── Status Helpers ──────────────────────────────────────────────────────────

export const statusColors: Record<string, keyof ColorScheme> = {
  WAITING: 'accent', PENDING: 'accent', ACTIVE: 'primary', COMPLETED: 'inkMuted', CANCELLED: 'danger',
};

export const statusLabel: Record<string, string> = {
  WAITING: 'En espera', PENDING: 'Por confirmar', ACTIVE: 'En consulta', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};

export const statusBgColors: Record<string, keyof ColorScheme> = {
  WAITING: 'accentBg', PENDING: 'accentBg', ACTIVE: 'primaryBg', COMPLETED: 'borderLight', CANCELLED: 'dangerBg',
};

// ─── Theme Context (re-exported) ─────────────────────────────────────────────

export type { ThemeContextValue } from './ThemeProvider';
export { ThemeProvider, useTheme } from './ThemeProvider';
