import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { AnswerCell } from '../components/AnswerCell';
import { RootStackParamList } from '../navigation/AppNavigator';
import { detectAnswers, GeminiKeyMissingError } from '../services/geminiVision';
import { examStorage } from '../services/storage';
import { Exam, QUESTION_TYPE_LABEL } from '../types';
import { getOptionsForType } from '../utils/grading';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export function ReviewScreen({ route, navigation }: Props) {
  const { examId, studentName, photoUris } = route.params;
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
            'Chave de API do Gemini não configurada. Crie um .env na raiz do projeto com EXPO_PUBLIC_GEMINI_API_KEY=... (obtenha em https://aistudio.google.com/apikey) e reinicie o expo. Você pode preencher as respostas manualmente abaixo.',
          );
        } else {
          setError(`Falha ao chamar Gemini: ${String(err)}. Preencha manualmente.`);
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

  const cycleAnswer = (questionId: string, options: string[]) => {
    setAnswers((prev) => {
      const current = prev[questionId] || '?';
      const allOpts = [...options, '?'];
      const idx = allOpts.indexOf(current);
      const next = allOpts[(idx + 1) % allOpts.length];
      return { ...prev, [questionId]: next };
    });
  };

  if (loading || !exam) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>
          Analisando fotos com Gemini...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        <Text style={styles.subtitle}>
          Aluno: <Text style={{ fontWeight: '700' }}>{studentName}</Text>
        </Text>
        <Text style={[styles.subtitle, { marginBottom: 12 }]}>
          Toque em uma alternativa para alternar a resposta detectada.
        </Text>

        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={{ color: '#991b1b' }}>{error}</Text>
            </Card.Content>
          </Card>
        )}

        {exam.questions.map((q) => {
          const options = getOptionsForType(q.type);
          const detected = answers[q.id] || '?';
          return (
            <Card key={q.id} style={styles.qCard}>
              <View style={styles.qHeader}>
                <Text style={styles.qNumber}>Questão {q.number}</Text>
                <Text style={styles.qType}>{QUESTION_TYPE_LABEL[q.type]}</Text>
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
            </Card>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          contentStyle={{ paddingVertical: 6 }}
          onPress={() =>
            navigation.navigate('Result', {
              examId,
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
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  subtitle: { color: '#374151', marginBottom: 4 },
  qCard: { marginBottom: 10, padding: 12 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  qNumber: { fontWeight: '600', color: '#111827' },
  qType: { color: '#6b7280', fontSize: 12 },
  cells: { flexDirection: 'row', flexWrap: 'wrap' },
  errorCard: { backgroundColor: '#fef2f2', marginBottom: 12, borderColor: '#fecaca', borderWidth: 1 },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
});
