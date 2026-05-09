import { ActivityIndicator } from 'react-native';

import { colors } from '../../theme';

interface SpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
}

export function Spinner({ size = 'small', color = colors.primary }: SpinnerProps) {
  return <ActivityIndicator size={size} color={color} />;
}
