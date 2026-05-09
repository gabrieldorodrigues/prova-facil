import { type VariantProps, cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'flex flex-row items-center self-start rounded-full px-2 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-brand-50',
        secondary: 'bg-bg-muted',
        destructive: 'bg-danger',
        success: 'bg-accent-50',
        warn: 'bg-warn-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const badgeTextVariants = cva('font-bold text-[11px] tracking-wide', {
  variants: {
    variant: {
      default: 'text-brand-700',
      secondary: 'text-ink-muted',
      destructive: 'text-white',
      success: 'text-accent-600',
      warn: 'text-warn-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
  label: string;
  labelClasses?: string;
}

function Badge({
  label,
  labelClasses,
  className,
  variant,
  ...props
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={cn(badgeTextVariants({ variant }), labelClasses)}>
        {label}
      </Text>
    </View>
  );
}

export { Badge, badgeVariants };
