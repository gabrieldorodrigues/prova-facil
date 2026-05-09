import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, elevation, radius, spacing } from '../theme';

interface Props {
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tint?: string;
}

export function StatCard({ label, value, hint, tint = colors.primary, icon }: Props) {
  return (
    <View style={[styles.card, elevation.sm]}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconBox, { backgroundColor: `${tint}15` }]}>{icon}</View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color: tint }]}>{value}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  value: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
