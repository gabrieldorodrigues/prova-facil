import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

type Variant = 'default' | 'selected' | 'correct' | 'wrong' | 'unknown';

interface Props {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  size?: number;
}

const STYLES: Record<Variant, { bg: string; fg: string; border: string }> = {
  default: { bg: colors.surface, fg: colors.textSecondary, border: colors.border },
  selected: { bg: colors.primary, fg: '#ffffff', border: colors.primaryDark },
  correct: { bg: colors.success, fg: '#ffffff', border: colors.scoreGood },
  wrong: { bg: colors.danger, fg: '#ffffff', border: '#dc2626' },
  unknown: { bg: colors.surfaceMuted, fg: colors.textMuted, border: colors.border },
};

export function AnswerCell({ label, variant = 'default', onPress, size = 44 }: Props) {
  const c = STYLES[variant];
  const content = (
    <View
      style={[
        styles.cell,
        { width: size, height: size, backgroundColor: c.bg, borderColor: c.border },
      ]}
    >
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
});
