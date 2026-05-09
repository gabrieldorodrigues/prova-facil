import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, scoreColor } from '../theme';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: Props) {
  const color = scoreColor(score);
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 16 : 22;
  const padV = size === 'sm' ? 4 : size === 'md' ? 6 : 10;
  const padH = size === 'sm' ? 8 : size === 'md' ? 12 : 16;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize }]}>
        {score.toFixed(1).replace('.', ',')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontWeight: '700' },
});
