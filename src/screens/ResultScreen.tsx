import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AnswerCell } from '../components/AnswerCell';
import { RootStackParamList } from '../navigation/AppNavigator';
import { correctionStorage, examStorage } from '../services/storage';
import { Exam } from '../types';
import { colors, elevation, radius, scoreColor, scoreLabel, spacing } from '../theme';
import { calculateGrade } from '../utils/grading';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ route, navigation }: Props) {
  const { examId, studentName, photoUris, detectedAnswers, studentId } = route.params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    examStorage.get(examId).then((e) => {
      if (!e) navigation.goBack();
      else setExam(e);
    });
  }, [examId, navigation]);

  const grade = useMemo(
    () => (exam ? calculateGrade(exam, detectedAnswers) : null),
    [exam, detectedAnswers],
  );

  if (!exam || !grade) return null;

  const color = scoreColor(grade.score);
  const label = scoreLabel(grade.score);

  const handleSave = async () => {
    setSaving(true);
    try {
      await correctionStorage.save({
        id: Crypto.randomUUID(),
        examId,
        studentId: studentId ?? null,
        studentNameRaw: studentName,
        photoUris,
        detectedAnswers,
        score: grade.score,
        hits: grade.hits,
        misses: grade.misses,
        correctedAt: new Date().toISOString(),
        identified: !!studentId,
      });
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: 'Home' }, { name: 'ExamDetail', params: { examId } }],
        }),
      );
    } catch (err) {
      Alert.alert('Erro', `Não foi possível salvar: ${err}`);
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
        <View style={[styles.heroCard, { backgroundColor: color }]}>
          <Text style={styles.heroLabel}>{label.toUpperCase()}</Text>
          <Text style={styles.heroScore}>
            {grade.score.toFixed(1).replace('.', ',')}
          </Text>
          <Text style={styles.heroStudent}>{studentName}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{grade.hits}</Text>
              <Text style={styles.heroStatLabel}>Acertos</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{grade.misses}</Text>
              <Text style={styles.heroStatLabel}>Erros</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {Math.round((grade.hits / exam.questions.length) * 100)}%
              </Text>
              <Text style={styles.heroStatLabel}>Aproveit.</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>Detalhe por questão</Text>

        <View style={[styles.detailsCard, elevation.sm]}>
          {grade.perQuestion.map((p, idx) => {
            const q = exam.questions.find((qq) => qq.id === p.questionId)!;
            return (
              <View
                key={p.questionId}
                style={[styles.detailRow, idx > 0 && styles.detailDivider]}
              >
                <View
                  style={[
                    styles.qNumberBadge,
                    p.correct
                      ? { backgroundColor: colors.accentLight }
                      : { backgroundColor: colors.dangerLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.qNumberText,
                      { color: p.correct ? colors.accent : colors.danger },
                    ]}
                  >
                    {q.number}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>
                    Aluno marcou • Esperado
                  </Text>
                  <View style={styles.detailAnswers}>
                    <AnswerCell
                      label={p.detected}
                      variant={p.correct ? 'correct' : 'wrong'}
                      size={32}
                    />
                    <Text style={styles.arrow}>→</Text>
                    <AnswerCell label={p.expected} variant="default" size={32} />
                    <View style={{ flex: 1 }} />
                    <Text style={styles.weight}>peso {q.weight}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={{ flex: 1, borderColor: colors.border }}
          textColor={colors.textSecondary}
        >
          Revisar
        </Button>
        <View style={{ width: spacing.sm }} />
        <Button
          mode="contained"
          icon="check"
          style={{ flex: 2 }}
          contentStyle={{ paddingVertical: 4 }}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        >
          Salvar correção
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroScore: {
    color: '#ffffff',
    fontSize: 84,
    fontWeight: '800',
    lineHeight: 92,
    letterSpacing: -2,
  },
  heroStudent: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  heroStat: { alignItems: 'center', flex: 1 },
  heroStatValue: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  detailDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  qNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  qNumberText: { fontWeight: '800', fontSize: 14 },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailAnswers: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  arrow: { color: colors.textMuted, fontSize: 16, marginHorizontal: spacing.sm },
  weight: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },

  bottomBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
  },
});
