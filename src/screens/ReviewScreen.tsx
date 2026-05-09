import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AnswerCell } from '../components/AnswerCell';
import { RootStackParamList } from '../navigation/AppNavigator';
import { detectAnswers, GeminiKeyMissingError } from '../services/geminiVision';
import { examStorage } from '../services/storage';
import { Exam, QUESTION_TYPE_LABEL } from '../types';
import { colors, elevation, radius, spacing } from '../theme';
import { getOptionsForType } from '../utils/grading';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export function ReviewScreen({ route, navigation }: Props) {
  const { examId, studentName, photoUris, studentId } = route.params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const e = await examStorage.get(examId);
      if (!e) {
        navigation.goBack();
        return;
      }
      if (!cancelled) setExam(e);

      try {
        const detected = await detectAnswers(e, photoUris);
        if (!cancelled) setAnswers(detected);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof GeminiKeyMissingError) {
          setError(
            'Chave da API do Gemini não configurada. Crie um .env com EXPO_PUBLIC_GEMINI_API_KEY=... (obtenha em aistudio.google.com/apikey). Você pode preencher manualmente abaixo.',
          );
        } else {
          setError(`Falha ao chamar a IA: ${String(err)}. Preencha manualmente abaixo.`);
        }
        const fallback: Record<string, string> = {};
        for (const q of e.questions) fallback[q.id] = '?';
        setAnswers(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, photoUris, navigation]);

  const stats = useMemo(() => {
    if (!exam) return { detected: 0, total: 0 };
    const total = exam.questions.length;
    const detected = exam.questions.filter((q) => {
      const a = answers[q.id];
      return a && a !== '?';
    }).length;
    return { detected, total };
  }, [exam, answers]);

  if (loading || !exam) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Analisando com IA</Text>
          <Text style={styles.loadingHint}>
            Lendo as marcações nas {photoUris.length} foto(s)...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View style={[styles.headerCard, elevation.sm]}>
          <Text style={styles.studentLabel}>Corrigindo prova de</Text>
          <Text style={styles.studentName}>{studentName}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(stats.detected / stats.total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats.detected}/{stats.total}
            </Text>
          </View>
          <Text style={styles.headerHint}>
            Toque em uma alternativa para alterar a resposta detectada.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {exam.questions.map((q) => {
          const options = getOptionsForType(q.type);
          const detected = answers[q.id] || '?';
          const isUnknown = detected === '?';
          return (
            <View key={q.id} style={[styles.qCard, elevation.sm]}>
              <View style={styles.qHeader}>
                <View style={styles.qNumberBadge}>
                  <Text style={styles.qNumberText}>{q.number}</Text>
                </View>
                <Text style={styles.qType}>{QUESTION_TYPE_LABEL[q.type]}</Text>
                <View style={{ flex: 1 }} />
                {isUnknown ? (
                  <View style={styles.unknownChip}>
                    <Text style={styles.unknownChipText}>verificar</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cells}>
                {options.map((opt) => (
                  <AnswerCell
                    key={opt}
                    label={opt}
                    variant={detected === opt ? 'selected' : 'default'}
                    onPress={() =>
                      setAnswers((p) => ({ ...p, [q.id]: detected === opt ? '?' : opt }))
                    }
                  />
                ))}
                <AnswerCell
                  label="?"
                  variant={detected === '?' ? 'unknown' : 'default'}
                  onPress={() => setAnswers((p) => ({ ...p, [q.id]: '?' }))}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          icon="calculator-variant"
          contentStyle={{ paddingVertical: spacing.sm }}
          onPress={() =>
            navigation.navigate('Result', {
              examId,
              studentId,
              studentName,
              photoUris,
              detectedAnswers: answers,
            })
          }
        >
          Calcular nota
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingBox: { alignItems: 'center' },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  loadingHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  progressText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  headerHint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },

  errorCard: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  errorIcon: { fontSize: 20 },
  errorText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },

  qCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  qNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  qNumberText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  qType: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  unknownChip: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  unknownChipText: { color: '#92400e', fontSize: 10, fontWeight: '700' },
  cells: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },

  bottomBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
