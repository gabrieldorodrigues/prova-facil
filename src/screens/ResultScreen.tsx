import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnswerCell } from '../components/AnswerCell';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { correctionStorage, examStorage } from '../services/storage';
import { Exam } from '../types';
import { calculateGrade } from '../utils/grading';

type Props = NativeStackScreenProps<HomeStackParamList, 'Result'>;

export function ResultScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { examId, studentName, photoUris, detectedAnswers, className } = route.params;
  const insets = useSafeAreaInsets();
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

  const scoreColor =
    grade.score >= 7 ? '#4ade80' : grade.score >= 5 ? '#fbbf24' : '#f87171';

  const handleSave = async () => {
    setSaving(true);
    try {
      await correctionStorage.save({
        id: Crypto.randomUUID(),
        examId,
        studentName,
        className,
        photoUris,
        detectedAnswers,
        score: grade.score,
        hits: grade.hits,
        misses: grade.misses,
        correctedAt: new Date().toISOString(),
      });
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: 'ExamDetail', params: { examId } },
          ],
        }),
      );
    } catch (err) {
      Alert.alert('Erro', `Não foi possível salvar: ${err}`);
      setSaving(false);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }}
      >
        <Card style={styles.scoreCard} mode="elevated">
          <Card.Content style={{ alignItems: 'center' }}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{studentName}</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, marginTop: 4 }}>
              Turma {className}
            </Text>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {grade.score.toFixed(1).replace('.', ',')}
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {grade.hits} acertos · {grade.misses} erros
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={[styles.section, { color: theme.colors.onSurface }]}>
          Detalhes por questão
        </Text>

        <Card mode="elevated" style={{ backgroundColor: theme.colors.surface }}>
          {grade.perQuestion.map((p, idx) => {
            const q = exam.questions.find((qq) => qq.id === p.questionId)!;
            return (
              <View key={p.questionId}>
                {idx > 0 && <Divider />}
                <View style={styles.row}>
                  <Text style={[styles.qNum, { color: theme.colors.onSurface }]}>{q.number}.</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.qLabel, { color: theme.colors.onSurfaceVariant }]}>Aluno marcou</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <AnswerCell
                        label={p.detected}
                        variant={p.correct ? 'correct' : 'wrong'}
                        size={32}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.qLabel, { color: theme.colors.onSurfaceVariant }]}>Esperado</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <AnswerCell label={p.expected} variant="default" size={32} />
                    </View>
                  </View>
                  <Text style={[styles.qWeight, { color: theme.colors.onSurfaceVariant }]}>peso {q.weight}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: 16 + insets.bottom }]}>
        <Button
          mode="outlined"
          style={{ flex: 1, marginRight: 8 }}
          onPress={() => navigation.goBack()}
        >
          Voltar
        </Button>
        <Button
          mode="contained"
          style={{ flex: 1 }}
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
  flex: { flex: 1 },
  scoreCard: { marginBottom: 16, paddingVertical: 16 },
  scoreText: { fontSize: 72, fontWeight: '800', marginVertical: 8 },
  section: { marginTop: 4, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  qNum: { width: 28, fontWeight: '600' },
  qLabel: { fontSize: 11 },
  qWeight: { fontSize: 12, marginLeft: 8 },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
  },
});
