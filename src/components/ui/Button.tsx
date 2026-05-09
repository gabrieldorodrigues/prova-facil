import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'flex flex-row items-center justify-center rounded-xl gap-2',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 active:bg-brand-600',
        secondary: 'bg-transparent border border-brand-500 active:bg-brand-50',
        destructive: 'bg-danger active:opacity-80',
        ghost: 'bg-transparent active:bg-brand-50',
        tonal: 'bg-brand-50 active:bg-brand-100',
        link: 'bg-transparent active:opacity-60',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const buttonTextVariants = cva('text-center font-semibold', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-brand-500',
      destructive: 'text-white',
      ghost: 'text-brand-500',
      tonal: 'text-brand-700',
      link: 'text-brand-500 underline',
    },
    size: {
      default: 'text-[15px]',
      sm: 'text-[13px]',
      lg: 'text-[16px]',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const SPINNER_COLOR: Record<NonNullable<VariantProps<typeof buttonVariants>['variant']>, string> = {
  default: '#ffffff',
  secondary: '#2C5F9E',
  destructive: '#ffffff',
  ghost: '#2C5F9E',
  tonal: '#1A3A5F',
  link: '#2C5F9E',
};

export interface ButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TouchableOpacity>, 'children'>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  label?: string;
  labelClasses?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

function Button({
  children,
  label,
  labelClasses,
  className,
  variant,
  size,
  iconLeft,
  iconRight,
  loading,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const v = variant ?? 'default';
  const isDisabled = disabled || loading;
  const content = children ?? label;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      className={cn(
        buttonVariants({ variant, size }),
        isDisabled && 'opacity-50',
      )}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={SPINNER_COLOR[v]} />
      ) : (
        iconLeft && <View>{iconLeft}</View>
      )}
      {content !== null && content !== undefined ? (
        React.isValidElement(content) ? (
          content
        ) : (
          <Text className={cn(buttonTextVariants({ variant, size }), labelClasses)}>
            {content}
          </Text>
        )
      ) : null}
      {iconRight && !loading ? <View>{iconRight}</View> : null}
    </TouchableOpacity>
  );
}

export { Button, buttonVariants, buttonTextVariants };
