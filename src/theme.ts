import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  primaryLight: '#eef2ff',
  primarySurface: '#e0e7ff',

  accent: '#10b981',
  accentLight: '#d1fae5',

  warning: '#f59e0b',
  warningLight: '#fef3c7',

  danger: '#ef4444',
  dangerLight: '#fee2e2',

  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  border: '#e2e8f0',

  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',

  scoreGood: '#16a34a',
  scoreMid: '#d97706',
  scoreBad: '#dc2626',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const elevation = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#ffffff',
    primaryContainer: colors.primarySurface,
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.accent,
    onSecondary: '#ffffff',
    secondaryContainer: colors.accentLight,
    surface: colors.surface,
    surfaceVariant: colors.surfaceMuted,
    background: colors.bg,
    error: colors.danger,
    errorContainer: colors.dangerLight,
    outline: colors.border,
    outlineVariant: colors.border,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
  },
};

export function scoreColor(score: number): string {
  if (score >= 7) return colors.scoreGood;
  if (score >= 5) return colors.scoreMid;
  return colors.scoreBad;
}

export function scoreLabel(score: number): string {
  if (score >= 7) return 'Aprovado';
  if (score >= 5) return 'Recuperação';
  return 'Reprovado';
}
