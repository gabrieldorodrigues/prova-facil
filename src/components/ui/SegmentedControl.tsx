import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '../../lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: Option<T>[];
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View className={cn('flex-row bg-bg-muted rounded-xl p-1 gap-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            activeOpacity={0.85}
            onPress={() => onValueChange(opt.value)}
            className={cn(
              'flex-1 py-2 px-2 rounded-lg items-center justify-center',
              active ? 'bg-bg-surface' : 'bg-transparent',
            )}
          >
            <Text
              className={cn(
                'text-[13px] font-semibold',
                active ? 'text-brand-600' : 'text-ink-muted',
              )}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
