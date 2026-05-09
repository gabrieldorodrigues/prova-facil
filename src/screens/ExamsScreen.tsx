import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ScoreBadge } from '../components/ScoreBadge';
import { Fab } from '../components/ui/Fab';
import { RootStackParamList } from '../navigation/AppNavigator';
import { classStorage, correctionStorage, examStorage } from '../services/storage';
import { Class, Exam } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ExamRow extends Exam {
  classNames: string[];
  correctionCount: number;
  averageScore: number | null;
}

export function ExamsScreen() {
  const navigation = useNavigation<Nav>();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [classList, examList] = await Promise.all([
      classStorage.list(),
      examStorage.list(),
    ]);
    const classMap = new Map<string, Class>(classList.map((c) => [c.id, c]));

    const merged: ExamRow[] = [];
    for (const e of examList) {
      const cs = await correctionStorage.listByExam(e.id);
      const avg = cs.length ? cs.reduce((s, c) => s + c.score, 0) / cs.length : null;
      const classNames = e.classIds
        .map((cid) => classMap.get(cid)?.name)
        .filter((n): n is string => !!n);
      merged.push({
        ...e,
        classNames: classNames.length ? classNames : ['sem turma'],
        correctionCount: cs.length,
        averageScore: avg,
      });
    }
    setExams(merged);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!loading && exams.length === 0) {
    return (
      <View className="flex-1 bg-bg justify-center items-center px-8">
        <EmptyState
          emoji="📝"
          title="Nenhuma prova ainda"
          description="Cadastre sua primeira avaliação. Você pode corrigir várias provas de uma vez com correção em lote."
          actionLabel="Criar prova"
          onAction={() => navigation.navigate('CreateExam', {})}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ExamDetail', { examId: item.id })}
            className="bg-bg-surface rounded-2xl p-4 mb-3 active:opacity-85"
          >
            <View className="flex-row justify-between items-center mb-2 gap-2">
              <View className="flex-row flex-wrap flex-1 gap-1">
                {item.classNames.map((cn, i) => (
                  <View
                    key={`${item.id}-${i}`}
                    className="bg-brand-50 px-2 py-1 rounded-md"
                  >
                    <Text className="text-brand-700 text-[11px] font-bold">
                      {cn}
                    </Text>
                  </View>
                ))}
              </View>
              {item.averageScore !== null ? (
                <ScoreBadge score={item.averageScore} size="sm" />
              ) : (
                <View className="bg-bg-muted px-2 py-1 rounded-md">
                  <Text className="text-ink-subtle text-[11px] font-semibold">
                    sem correções
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[17px] font-bold text-ink mb-1">{item.name}</Text>
            <View className="flex-row items-center">
              <Text className="text-[13px] text-ink-muted">
                {item.questions.length} questões
              </Text>
              <View className="w-1 h-1 rounded-full bg-ink-subtle mx-2" />
              <Text className="text-[13px] text-ink-muted">
                {item.correctionCount} aluno{item.correctionCount === 1 ? '' : 's'}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Fab
        icon="add"
        label="Nova prova"
        accessibilityLabel="Criar nova prova"
        onPress={() => navigation.navigate('CreateExam', {})}
      />
    </View>
  );
}
