// Design tokens for PocketLLM v3.0
// Unified spacing, radius, typography, and elevation system

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
} as const;

export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 12,
  lg: 20,
  xl: 32,
  '2xl': 40,
  full: 9999,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
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
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;

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
}

const midnight: ThemeColors = {
  background: '#0A0E1A',
  backgroundSecondary: '#0F1420',
  surface: 'rgba(255, 255, 255, 0.04)',
  surfaceVariant: 'rgba(255, 255, 255, 0.08)',
  surfaceElevated: 'rgba(255, 255, 255, 0.10)',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',

  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#8B5CF6',
  accent: '#EC4899',

  userBubble: '#6366F1',
  userBubbleText: '#FFFFFF',
  assistantBubble: 'rgba(255, 255, 255, 0.05)',
  assistantBubbleText: '#F1F5F9',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  highlight: 'rgba(99, 102, 241, 0.15)',
  glow: 'rgba(99, 102, 241, 0.3)',
};

const aurora: ThemeColors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  surface: 'rgba(99, 102, 241, 0.04)',
  surfaceVariant: 'rgba(99, 102, 241, 0.08)',
  surfaceElevated: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#A5B4FC',
  secondary: '#A855F7',
  accent: '#EC4899',

  userBubble: '#6366F1',
  userBubbleText: '#FFFFFF',
  assistantBubble: 'rgba(99, 102, 241, 0.06)',
  assistantBubbleText: '#0F172A',

  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  border: 'rgba(15, 23, 42, 0.08)',
  divider: 'rgba(15, 23, 42, 0.05)',
  overlay: 'rgba(15, 23, 42, 0.4)',
  highlight: 'rgba(99, 102, 241, 0.1)',
  glow: 'rgba(99, 102, 241, 0.2)',
};

const solar: ThemeColors = {
  background: '#FAF6EE',
  backgroundSecondary: '#F5E9D3',
  surface: 'rgba(234, 88, 12, 0.04)',
  surfaceVariant: 'rgba(234, 88, 12, 0.08)',
  surfaceElevated: '#FFFCF5',

  text: '#451A03',
  textSecondary: '#78350F',
  textTertiary: '#A16207',
  textInverse: '#FFFCF5',

  primary: '#EA580C',
  primaryDark: '#C2410C',
  primaryLight: '#FB923C',
  secondary: '#D97706',
  accent: '#B45309',

  userBubble: '#EA580C',
  userBubbleText: '#FFFCF5',
  assistantBubble: 'rgba(234, 88, 12, 0.06)',
  assistantBubbleText: '#451A03',

  success: '#16A34A',
  warning: '#CA8A04',
  error: '#B91C1C',
  info: '#0284C7',

  border: 'rgba(69, 26, 3, 0.1)',
  divider: 'rgba(69, 26, 3, 0.06)',
  overlay: 'rgba(69, 26, 3, 0.4)',
  highlight: 'rgba(234, 88, 12, 0.12)',
  glow: 'rgba(234, 88, 12, 0.25)',
};

const voidTheme: ThemeColors = {
  background: '#000000',
  backgroundSecondary: '#0A0A0A',
  surface: 'rgba(236, 72, 153, 0.04)',
  surfaceVariant: 'rgba(236, 72, 153, 0.08)',
  surfaceElevated: '#121212',

  text: '#F5F5F5',
  textSecondary: '#A1A1AA',
  textTertiary: '#52525B',
  textInverse: '#000000',

  primary: '#EC4899',
  primaryDark: '#DB2777',
  primaryLight: '#F472B6',
  secondary: '#A855F7',
  accent: '#8B5CF6',

  userBubble: '#EC4899',
  userBubbleText: '#FFFFFF',
  assistantBubble: 'rgba(236, 72, 153, 0.06)',
  assistantBubbleText: '#F5F5F5',

  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#06B6D4',

  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.04)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  highlight: 'rgba(236, 72, 153, 0.15)',
  glow: 'rgba(236, 72, 153, 0.3)',
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
