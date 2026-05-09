export const colors = {
  primary: '#2C5F9E',
  primaryDark: '#234D7E',
  primaryLight: '#EAF1F8',
  primarySurface: '#D5E3F2',

  secondary: '#7E8BA3',

  accent: '#FFC107',
  accentDark: '#FFA000',
  accentLight: '#FFF8E1',

  success: '#16A34A',
  successLight: '#DCFCE7',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  bg: '#F5F5F0',
  surface: '#FFFFFF',
  surfaceMuted: '#EDECE5',
  border: '#DDDCD4',

  textPrimary: '#333333',
  textSecondary: '#7E8BA3',
  textMuted: '#7E8BA3',
  textSubtle: '#A0AEC0',

  scoreGood: '#16A34A',
  scoreMid: '#D97706',
  scoreBad: '#DC2626',
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
