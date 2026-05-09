import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type Variant = 'default' | 'selected' | 'correct' | 'wrong' | 'unknown';

interface Props {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  size?: number;
}

const COLORS: Record<Variant, { bg: string; fg: string; border: string }> = {
  default: { bg: '#fff', fg: '#374151', border: '#d1d5db' },
  selected: { bg: '#2563eb', fg: '#fff', border: '#1d4ed8' },
  correct: { bg: '#16a34a', fg: '#fff', border: '#15803d' },
  wrong: { bg: '#dc2626', fg: '#fff', border: '#b91c1c' },
  unknown: { bg: '#f3f4f6', fg: '#6b7280', border: '#d1d5db' },
};

export function AnswerCell({ label, variant = 'default', onPress, size = 40 }: Props) {
  const c = COLORS[variant];
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
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
});
