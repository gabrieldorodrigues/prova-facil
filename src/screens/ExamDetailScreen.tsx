import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, List, Text } from 'react-native-paper';
import { AnswerCell } from '../components/AnswerCell';
import { RootStackParamList } from '../navigation/AppNavigator';
import { exportCorrectionsCSV } from '../services/csvExport';
import { correctionStorage, examStorage } from '../services/storage';
import { Correction, Exam, QUESTION_TYPE_LABEL } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamDetail'>;

export function ExamDetailScreen({ route, navigation }: Props) {
  const { examId } = route.params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);

  const load = useCallback(async () => {
    const e = await examStorage.get(examId);
    if (!e) {
      navigation.goBack();
      return;
    }
    setExam(e);
    setCorrections(await correctionStorage.listByExam(examId));
  }, [examId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!exam) return null;

  const handleExport = async () => {
    if (corrections.length === 0) {
      Alert.alert('Sem correções', 'Corrija pelo menos um aluno antes de exportar.');
      return;
    }
    try {
      await exportCorrectionsCSV(exam, corrections);
    } catch (err) {
      Alert.alert('Erro ao exportar', String(err));
    }
  };

  const handleDelete = () => {
    Alert.alert('Excluir prova?', 'Todas as correções desta prova serão removidas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await examStorage.remove(examId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Card style={styles.card}>
        <Card.Title
          title={exam.name}
          subtitle={`Turma ${exam.className} • ${exam.questions.length} questões`}
          right={(p) => <IconButton {...p} icon="trash-can-outline" onPress={handleDelete} />}
        />
      </Card>

      <Text variant="titleMedium" style={styles.section}>
        Gabarito
      </Text>
      <Card style={styles.card}>
        <Card.Content>
          {exam.questions.map((q) => (
            <View key={q.id} style={styles.gabaritoRow}>
              <Text style={styles.qNumber}>{q.number}.</Text>
              <Text style={styles.qType}>{QUESTION_TYPE_LABEL[q.type]}</Text>
              <AnswerCell label={q.correctAnswer} variant="correct" size={32} />
              <Text style={styles.qWeight}>peso {q.weight}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="camera"
          style={{ flex: 1, marginRight: 8 }}
          onPress={() => navigation.navigate('Capture', { examId })}
        >
          Corrigir Aluno
        </Button>
        <Button mode="outlined" icon="download" onPress={handleExport}>
          CSV
        </Button>
      </View>

      <Divider style={{ marginVertical: 16 }} />

      <Text variant="titleMedium" style={styles.section}>
        Correções ({corrections.length})
      </Text>

      {corrections.length === 0 ? (
        <Text style={{ color: '#9ca3af', padding: 12 }}>
          Nenhum aluno corrigido ainda.
        </Text>
      ) : (
        <Card style={styles.card}>
          {corrections.map((c, idx) => (
            <React.Fragment key={c.id}>
              {idx > 0 && <Divider />}
              <List.Item
                title={c.studentName}
                description={`${c.hits} acertos • ${c.misses} erros • ${new Date(
                  c.correctedAt,
                ).toLocaleDateString('pt-BR')}`}
                right={() => (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{c.score.toFixed(1)}</Text>
                  </View>
                )}
              />
            </React.Fragment>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: { marginBottom: 12 },
  section: { marginTop: 8, marginBottom: 8, color: '#374151' },
  gabaritoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  qNumber: { width: 28, fontWeight: '600' },
  qType: { width: 100, color: '#6b7280', fontSize: 12 },
  qWeight: { marginLeft: 12, color: '#6b7280', fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  scoreBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  scoreText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
