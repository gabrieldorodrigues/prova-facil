import { Text, View } from 'react-native';

import { cn } from '../../lib/utils';

function Card({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn('rounded-2xl border border-line bg-bg-surface', className)}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('p-4', className)} {...props} />;
}

function CardTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn('text-[16px] font-bold text-ink', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn('text-[13px] text-ink-muted', className)}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn('p-4 pt-0', className)} {...props} />;
}

function CardFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn('flex flex-row items-center p-4 pt-0', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
