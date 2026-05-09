import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ViewStyle } from 'react-native';

import { cn } from '../../lib/utils';

interface IconButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  bgColor?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  className?: string;
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  size = 22,
  color = '#475569',
  bgColor,
  onPress,
  disabled,
  style,
  className,
  accessibilityLabel,
}: IconButtonProps) {
  const buttonSize = size + 18;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? String(icon)}
      style={[
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: bgColor,
        },
        style as ViewStyle,
      ]}
      className={cn(
        'items-center justify-center active:opacity-70',
        disabled && 'opacity-40',
        className,
      )}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}
