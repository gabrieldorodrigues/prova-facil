import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';

import { cn } from '../../lib/utils';

interface FabProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label?: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  className?: string;
  accessibilityLabel?: string;
}

export function Fab({
  icon,
  label,
  onPress,
  style,
  className,
  accessibilityLabel,
}: FabProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label ?? String(icon)}
      style={style}
      className={cn(
        'absolute right-4 bottom-4 bg-brand-500 active:bg-brand-600 rounded-full shadow-lg flex-row items-center',
        label ? 'pl-4 pr-5 h-14 gap-2' : 'w-14 h-14 justify-center',
        className,
      )}
    >
      <Ionicons name={icon} size={22} color="#ffffff" />
      {label ? (
        <Text className="text-white font-bold text-[14px]">{label}</Text>
      ) : null}
    </Pressable>
  );
}
