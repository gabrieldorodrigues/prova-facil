import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, List, Text, useTheme } from 'react-native-paper';
import { AnswerCell } from '../components/AnswerCell';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { exportCorrectionsCSV } from '../services/csvExport';
import { correctionStorage, examStorage } from '../services/storage';
import { Correction, Exam, QUESTION_TYPE_LABEL } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ExamDetail'>;

export function ExamDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Card style={styles.card} mode="elevated">
        <Card.Title
          title={exam.name}
          titleStyle={{ fontWeight: '700', color: theme.colors.onSurface }}
          subtitle={`Turma ${exam.className} · ${exam.questions.length} questões`}
          subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
          right={(p) => <IconButton {...p} icon="trash-can-outline" onPress={handleDelete} />}
        />
      </Card>

      <Text variant="titleMedium" style={[styles.section, { color: theme.colors.onSurface }]}>
        Gabarito
      </Text>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          {exam.questions.map((q) => (
            <View key={q.id} style={styles.gabaritoRow}>
              <Text style={[styles.qNumber, { color: theme.colors.onSurface }]}>{q.number}.</Text>
              <Text style={[styles.qType, { color: theme.colors.onSurfaceVariant }]}>
                {QUESTION_TYPE_LABEL[q.type]}
              </Text>
              <AnswerCell label={q.correctAnswer} variant="correct" size={32} />
              <Text style={[styles.qWeight, { color: theme.colors.onSurfaceVariant }]}>peso {q.weight}</Text>
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

      <Text variant="titleMedium" style={[styles.section, { color: theme.colors.onSurface }]}>
        Correções ({corrections.length})
      </Text>

      {corrections.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant, padding: 12 }}>Nenhum aluno corrigido ainda.</Text>
      ) : (
        <Card style={styles.card} mode="elevated">
          {corrections.map((c, idx) => (
            <React.Fragment key={c.id}>
              {idx > 0 && <Divider />}
              <List.Item
                title={c.studentName}
                titleStyle={{ fontWeight: '600', color: theme.colors.onSurface }}
                description={`Turma ${c.className ?? exam.className} · ${c.hits} acertos · ${c.misses} erros · ${new Date(
                  c.correctedAt,
                ).toLocaleDateString('pt-BR')}`}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                right={() => (
                  <View
                    style={[
                      styles.scoreBadge,
                      {
                        backgroundColor: theme.colors.primaryContainer,
                        borderRadius: 4,
                      },
                    ]}
                  >
                    <Text style={[styles.scoreText, { color: theme.colors.onPrimaryContainer }]}>
                      {c.score.toFixed(1)}
                    </Text>
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
  container: { flex: 1 },
  card: { marginBottom: 12 },
  section: { marginTop: 8, marginBottom: 8 },
  gabaritoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  qNumber: { width: 28, fontWeight: '600' },
  qType: { width: 100, fontSize: 12 },
  qWeight: { marginLeft: 12, fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  scoreText: { fontWeight: '700', fontSize: 16 },
});
