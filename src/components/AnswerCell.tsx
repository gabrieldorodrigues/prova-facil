import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type Variant = 'default' | 'selected' | 'correct' | 'wrong' | 'unknown';

interface Props {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  size?: number;
}

export function AnswerCell({ label, variant = 'default', onPress, size = 40 }: Props) {
  const theme = useTheme();

  const colors = useMemo(() => {
    const surfaceVariant = theme.colors.surfaceVariant;
    const onSurface = theme.colors.onSurface;
    const outline = theme.colors.outline;
    const primary = theme.colors.primary;
    const onPrimary = theme.colors.onPrimary;
    return {
      default: { bg: surfaceVariant, fg: onSurface, border: outline },
      selected: { bg: primary, fg: onPrimary, border: primary },
      correct: { bg: '#22c55e', fg: '#052e16', border: '#16a34a' },
      wrong: { bg: '#f87171', fg: '#450a0a', border: '#ef4444' },
      unknown: { bg: theme.colors.surface, fg: theme.colors.onSurfaceVariant, border: outline },
    } as const;
  }, [theme.colors]);

  const c = colors[variant];
  const content = (
    <View
      style={[
        styles.cell,
        { width: size, height: size, backgroundColor: c.bg, borderColor: c.border },
      ]}
    >
      <Text style={{ color: c.fg, fontWeight: '600' }}>{label}</Text>
    </View>
  );
  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
});
