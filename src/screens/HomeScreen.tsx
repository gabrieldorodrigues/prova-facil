import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { correctionStorage, examStorage } from '../services/storage';
import { Exam } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

interface ExamWithCount extends Exam {
  correctionCount: number;
}

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!loading && exams.length === 0 && (
        <View style={styles.empty}>
          <Icon source="clipboard-text-outline" size={64} color={theme.colors.onSurfaceVariant} />
          <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            Nenhuma prova ainda
          </Text>
          <Text style={[styles.emptyBody, { color: theme.colors.onSurfaceVariant }]}>
            Use a aba <Text style={{ fontWeight: '700', color: theme.colors.primary }}>Nova prova</Text> para
            cadastrar o gabarito. Depois, abra a prova e toque em{' '}
            <Text style={{ fontWeight: '700', color: theme.colors.primary }}>Corrigir aluno</Text> para fotografar as
            respostas.
          </Text>
        </View>
      )}

      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const created = new Date(item.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          return (
            <Card
              style={styles.card}
              mode="elevated"
              onPress={() => navigation.navigate('ExamDetail', { examId: item.id })}
            >
              <Card.Title
                title={item.name}
                titleStyle={[styles.cardTitle, { color: theme.colors.onSurface }]}
                subtitle={`Turma ${item.className} · ${item.questions.length} questões · ${created}`}
                subtitleStyle={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}
                right={() => (
                  <Icon source="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
                )}
              />
              <Card.Content style={styles.cardFooter}>
                <Text style={[styles.cardMeta, { color: theme.colors.onSurfaceVariant }]}>
                  {item.correctionCount === 0
                    ? 'Nenhum aluno corrigido'
                    : `${item.correctionCount} aluno(s) corrigido(s)`}
                </Text>
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 24 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: { marginTop: 16, marginBottom: 12, textAlign: 'center' },
  emptyBody: { textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  card: { marginBottom: 12 },
  cardTitle: { fontWeight: '700' },
  cardSubtitle: { marginTop: 2 },
  cardFooter: { paddingTop: 0 },
  cardMeta: { fontSize: 14 },
});
