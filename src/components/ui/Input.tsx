import { forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { cn } from '../../lib/utils';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  error?: string;
  containerClasses?: string;
}

const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      className,
      label,
      labelClasses,
      inputClasses,
      error,
      containerClasses,
      multiline,
      ...props
    },
    ref,
  ) => (
    <View className={cn('flex flex-col gap-1.5', containerClasses, className)}>
      {label ? (
        <Text className={cn('text-[13px] font-semibold text-ink-muted', labelClasses)}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        multiline={multiline}
        placeholderTextColor="#A0AEC0"
        className={cn(
          'border rounded-xl px-4 bg-bg-surface text-[15px] text-ink',
          multiline ? 'py-3' : 'py-3',
          error ? 'border-danger' : 'border-line focus:border-brand-500',
          inputClasses,
        )}
        {...props}
      />
      {error ? (
        <Text className="text-[12px] text-danger mt-0.5">{error}</Text>
      ) : null}
    </View>
  ),
);

Input.displayName = 'Input';

export { Input };
