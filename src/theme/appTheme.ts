import { DarkTheme, Theme } from '@react-navigation/native';
import { MD3DarkTheme, MD3Theme } from 'react-native-paper';

/** Paleta zinc / indigo — dark moderno, cantos discretos (roundness no tema Paper). */
export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 4,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818cf8',
    onPrimary: '#0b0d14',
    primaryContainer: '#4338ca',
    onPrimaryContainer: '#e0e7ff',
    secondary: '#2dd4bf',
    onSecondary: '#042f2e',
    secondaryContainer: '#0f766e',
    onSecondaryContainer: '#ccfbf1',
    background: '#09090b',
    onBackground: '#fafafa',
    surface: '#18181b',
    onSurface: '#fafafa',
    surfaceVariant: '#27272a',
    onSurfaceVariant: '#a1a1aa',
    outline: '#52525b',
    outlineVariant: '#3f3f46',
    error: '#f87171',
    onError: '#450a0a',
    errorContainer: '#7f1d1d',
    onErrorContainer: '#fecaca',
  },
};

export const navigationDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: paperDarkTheme.colors.primary,
    background: paperDarkTheme.colors.background,
    card: paperDarkTheme.colors.surface,
    text: paperDarkTheme.colors.onSurface,
    border: paperDarkTheme.colors.outlineVariant,
    notification: paperDarkTheme.colors.error,
  },
};
