import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { AnswerCell } from '../components/AnswerCell';
import { RootStackParamList } from '../navigation/AppNavigator';
import { correctionStorage, examStorage } from '../services/storage';
import { Exam } from '../types';
import { calculateGrade } from '../utils/grading';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ route, navigation }: Props) {
  const { examId, studentName, photoUris, detectedAnswers } = route.params;
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

  const scoreColor = grade.score >= 7 ? '#16a34a' : grade.score >= 5 ? '#d97706' : '#dc2626';

  const handleSave = async () => {
    setSaving(true);
    try {
      await correctionStorage.save({
        id: Crypto.randomUUID(),
        examId,
        studentName,
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
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        <Card style={styles.scoreCard}>
          <Card.Content style={{ alignItems: 'center' }}>
            <Text style={{ color: '#6b7280' }}>{studentName}</Text>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {grade.score.toFixed(1).replace('.', ',')}
            </Text>
            <Text style={{ color: '#6b7280' }}>
              {grade.hits} acertos • {grade.misses} erros
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.section}>
          Detalhes por questão
        </Text>

        <Card>
          {grade.perQuestion.map((p, idx) => {
            const q = exam.questions.find((qq) => qq.id === p.questionId)!;
            return (
              <View key={p.questionId}>
                {idx > 0 && <Divider />}
                <View style={styles.row}>
                  <Text style={styles.qNum}>{q.number}.</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qLabel}>Aluno marcou</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <AnswerCell
                        label={p.detected}
                        variant={p.correct ? 'correct' : 'wrong'}
                        size={32}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qLabel}>Esperado</Text>
                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                      <AnswerCell label={p.expected} variant="default" size={32} />
                    </View>
                  </View>
                  <Text style={styles.qWeight}>peso {q.weight}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      </ScrollView>

      <View style={styles.bottomBar}>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scoreCard: { marginBottom: 16, paddingVertical: 16 },
  scoreText: { fontSize: 72, fontWeight: '800', marginVertical: 8 },
  section: { marginTop: 4, marginBottom: 8, color: '#374151' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  qNum: { width: 28, fontWeight: '600' },
  qLabel: { fontSize: 11, color: '#9ca3af' },
  qWeight: { color: '#6b7280', fontSize: 12, marginLeft: 8 },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
  },
});
