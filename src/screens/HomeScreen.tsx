import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, FAB, Text } from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';
import { correctionStorage, examStorage } from '../services/storage';
import { Exam } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface ExamWithCount extends Exam {
  correctionCount: number;
}

export function HomeScreen({ navigation }: Props) {
  const [exams, setExams] = useState<ExamWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await examStorage.list();
    const withCounts = await Promise.all(
      all.map(async (e) => ({
        ...e,
        correctionCount: (await correctionStorage.listByExam(e.id)).length,
      })),
    );
    setExams(withCounts);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      {!loading && exams.length === 0 && (
        <View style={styles.empty}>
          <Text variant="headlineSmall" style={{ color: '#6b7280', marginBottom: 8 }}>
            Nenhuma prova ainda
          </Text>
          <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
            Toque no botão "+" para cadastrar a primeira avaliação.
          </Text>
        </View>
      )}

      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('ExamDetail', { examId: item.id })}
          >
            <Card.Title
              title={item.name}
              subtitle={`Turma ${item.className} • ${item.questions.length} questões`}
            />
            <Card.Content>
              <Text style={{ color: '#6b7280' }}>
                {item.correctionCount} aluno(s) corrigido(s)
              </Text>
            </Card.Content>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        label="Nova Prova"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateExam')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { marginBottom: 12 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#2563eb' },
});
