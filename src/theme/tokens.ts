// Design tokens for PocketLLM v3.1 — Aurora Glass
// Glassmorphism + violet/indigo glow system for all 4 themes

export const SPACING = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  // Backwards-compat aliases
  huge: 48,
  xxl: 32,
  xxxl: 40,
} as const;

export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
  // Backwards-compat aliases
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
  // Backwards-compat aliases (legacy index.ts values)
  xxl: 24,
  xxxl: 32,
  display: 40,
  hero: 48,
} as const;

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const;

export const ELEVATION = {
  0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 14,
  },
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    tension: 80,
    friction: 10,
  },
} as const;

// Theme definitions
export type ThemeName = 'midnight' | 'aurora' | 'solar' | 'void';

export interface ThemeColors {
  // Backgrounds (layered for depth)
  background: string;
  backgroundDeep: string;
  backgroundSecondary: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;

  // Glass surfaces
  glassBg: string;
  glassBgStrong: string;
  glassBorder: string;
  glassHighlight: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;

  // Gradient stops (for primary button/header)
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;

  // Bubbles
  userBubble: string;
  userBubbleText: string;
  assistantBubble: string;
  assistantBubbleText: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // UI elements
  border: string;
  divider: string;
  overlay: string;
  highlight: string;
  glow: string;
  glowStrong: string;
  inputBackground: string;
}

// Midnight — default. Deep indigo + violet glow.
const midnight: ThemeColors = {
  background: '#0A0B1E',
  backgroundDeep: '#050614',
  backgroundSecondary: '#0F1129',
  surface: 'rgba(255, 255, 255, 0.04)',
  surfaceVariant: 'rgba(255, 255, 255, 0.07)',
  surfaceElevated: 'rgba(255, 255, 255, 0.09)',

  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassBgStrong: 'rgba(20, 20, 40, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassHighlight: 'rgba(255, 255, 255, 0.18)',

  text: '#F8FAFC',
  textSecondary: '#B4B6CC',
  textTertiary: '#7A7E96',
  textInverse: '#0F172A',

  primary: '#7C3AED',
  primaryDark: '#5B21B6',
  primaryLight: '#A78BFA',
  secondary: '#6366F1',
  accent: '#22D3EE',

  gradientStart: '#A78BFA',
  gradientMid: '#7C3AED',
  gradientEnd: '#6366F1',

  userBubble: '#7C3AED',
  userBubbleText: '#FFFFFF',
  assistantBubble: 'rgba(255, 255, 255, 0.05)',
  assistantBubbleText: '#F8FAFC',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  highlight: 'rgba(124, 58, 237, 0.18)',
  glow: 'rgba(124, 58, 237, 0.30)',
  glowStrong: 'rgba(124, 58, 237, 0.55)',
  inputBackground: 'rgba(255, 255, 255, 0.06)',
};

// Aurora — light. White glass + soft lavender.
const aurora: ThemeColors = {
  background: '#F5F3FF',
  backgroundDeep: '#EDE9FE',
  backgroundSecondary: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.6)',
  surfaceVariant: 'rgba(99, 102, 241, 0.06)',
  surfaceElevated: '#FFFFFF',

  glassBg: 'rgba(255, 255, 255, 0.65)',
  glassBgStrong: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(124, 58, 237, 0.10)',
  glassHighlight: 'rgba(255, 255, 255, 1)',

  text: '#1E1B4B',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#A5B4FC',
  secondary: '#A855F7',
  accent: '#EC4899',

  gradientStart: '#A78BFA',
  gradientMid: '#7C3AED',
  gradientEnd: '#6366F1',

  userBubble: '#6366F1',
  userBubbleText: '#FFFFFF',
  assistantBubble: 'rgba(99, 102, 241, 0.06)',
  assistantBubbleText: '#1E1B4B',

  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  border: 'rgba(99, 102, 241, 0.12)',
  divider: 'rgba(99, 102, 241, 0.06)',
  overlay: 'rgba(30, 27, 75, 0.4)',
  highlight: 'rgba(99, 102, 241, 0.10)',
  glow: 'rgba(99, 102, 241, 0.18)',
  glowStrong: 'rgba(99, 102, 241, 0.32)',
  inputBackground: 'rgba(255, 255, 255, 0.7)',
};

// Solar — warm cream + amber glow.
const solar: ThemeColors = {
  background: '#FAF6EE',
  backgroundDeep: '#F2E9D5',
  backgroundSecondary: '#FFFCF5',
  surface: 'rgba(234, 88, 12, 0.04)',
  surfaceVariant: 'rgba(234, 88, 12, 0.08)',
  surfaceElevated: '#FFFCF5',

  glassBg: 'rgba(255, 252, 245, 0.75)',
  glassBgStrong: 'rgba(255, 252, 245, 0.95)',
  glassBorder: 'rgba(234, 88, 12, 0.14)',
  glassHighlight: 'rgba(255, 255, 255, 1)',

  text: '#451A03',
  textSecondary: '#78350F',
  textTertiary: '#A16207',
  textInverse: '#FFFCF5',

  primary: '#EA580C',
  primaryDark: '#C2410C',
  primaryLight: '#FB923C',
  secondary: '#D97706',
  accent: '#B45309',

  gradientStart: '#FB923C',
  gradientMid: '#EA580C',
  gradientEnd: '#C2410C',

  userBubble: '#EA580C',
  userBubbleText: '#FFFCF5',
  assistantBubble: 'rgba(234, 88, 12, 0.05)',
  assistantBubbleText: '#451A03',

  success: '#16A34A',
  warning: '#CA8A04',
  error: '#B91C1C',
  info: '#0284C7',

  border: 'rgba(234, 88, 12, 0.16)',
  divider: 'rgba(234, 88, 12, 0.08)',
  overlay: 'rgba(69, 26, 3, 0.4)',
  highlight: 'rgba(234, 88, 12, 0.10)',
  glow: 'rgba(234, 88, 12, 0.22)',
  glowStrong: 'rgba(234, 88, 12, 0.40)',
  inputBackground: 'rgba(255, 252, 245, 0.8)',
};

// Void — true black + magenta.
const voidTheme: ThemeColors = {
  background: '#000000',
  backgroundDeep: '#000000',
  backgroundSecondary: '#0A0A0A',
  surface: 'rgba(236, 72, 153, 0.04)',
  surfaceVariant: 'rgba(236, 72, 153, 0.08)',
  surfaceElevated: '#0F0F10',

  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassBgStrong: 'rgba(15, 15, 16, 0.92)',
  glassBorder: 'rgba(236, 72, 153, 0.16)',
  glassHighlight: 'rgba(255, 255, 255, 0.12)',

  text: '#F5F5F5',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  textInverse: '#000000',

  primary: '#EC4899',
  primaryDark: '#DB2777',
  primaryLight: '#F472B6',
  secondary: '#A855F7',
  accent: '#8B5CF6',

  gradientStart: '#F472B6',
  gradientMid: '#EC4899',
  gradientEnd: '#A855F7',

  userBubble: '#EC4899',
  userBubbleText: '#FFFFFF',
  assistantBubble: 'rgba(236, 72, 153, 0.05)',
  assistantBubbleText: '#F5F5F5',

  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#06B6D4',

  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.04)',
  overlay: 'rgba(0, 0, 0, 0.8)',
  highlight: 'rgba(236, 72, 153, 0.15)',
  glow: 'rgba(236, 72, 153, 0.30)',
  glowStrong: 'rgba(236, 72, 153, 0.55)',
  inputBackground: 'rgba(255, 255, 255, 0.05)',
};

const themes: Record<ThemeName, ThemeColors> = {
  midnight,
  aurora,
  solar,
  void: voidTheme,
};

export const getThemeColors = (name: ThemeName): ThemeColors => themes[name];

export const THEME_NAMES: ThemeName[] = ['midnight', 'aurora', 'solar', 'void'];

export const THEME_LABELS: Record<ThemeName, string> = {
  midnight: 'Midnight',
  aurora: 'Aurora',
  solar: 'Solar',
  void: 'Void',
};

export const THEME_DESCRIPTIONS: Record<ThemeName, string> = {
  midnight: 'Deep indigo with violet glow',
  aurora: 'Light glass with lavender',
  solar: 'Warm cream with amber',
  void: 'Pure black with magenta',
};
