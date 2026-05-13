import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScoreBadge } from '../components/ScoreBadge';
import { StatCard } from '../components/StatCard';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import {
  classStorage,
  correctionStorage,
  examStorage,
  studentStorage,
} from '../services/storage';
import { Class, Correction, Exam } from '../types';
import { colors } from '../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface ExamRow extends Exam {
  classNames: string[];
  correctionCount: number;
  averageScore: number | null;
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [classCount, setClassCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [allCorrections, setAllCorrections] = useState<Correction[]>([]);

  const load = useCallback(async () => {
    const [classList, examList] = await Promise.all([
      classStorage.list(),
      examStorage.list(),
    ]);
    const classMap = new Map<string, Class>(classList.map((c) => [c.id, c]));

    let totalStudents = 0;
    for (const c of classList) {
      totalStudents += (await studentStorage.listByClass(c.id)).length;
    }

    const flat: Correction[] = [];
    const merged: ExamRow[] = [];
    for (const e of examList) {
      const cs = await correctionStorage.listByExam(e.id);
      flat.push(...cs);
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
    setClassCount(classList.length);
    setStudentCount(totalStudents);
    setAllCorrections(flat);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const stats = useMemo(() => {
    const totalCorrections = allCorrections.length;
    const avg = totalCorrections
      ? allCorrections.reduce((s, c) => s + c.score, 0) / totalCorrections
      : 0;
    return { examCount: exams.length, totalCorrections, avg };
  }, [exams, allCorrections]);

  const recentExams = exams.slice(0, 3);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text className="text-[22px] font-bold text-ink">Olá, professor 👋</Text>
      <Text className="text-[14px] text-ink-muted mt-1">
        Resumo das suas correções
      </Text>

      <View className="flex-row mt-4">
        <StatCard
          label="Turmas"
          value={String(classCount)}
          hint={`${studentCount} aluno(s)`}
          tint={colors.primary}
        />
        <View className="w-2" />
        <StatCard
          label="Avaliações"
          value={String(stats.examCount)}
          hint="cadastradas"
          tint={colors.accent}
        />
        <View className="w-2" />
        <StatCard
          label="Média"
          value={
            stats.totalCorrections
              ? stats.avg.toFixed(1).replace('.', ',')
              : '—'
          }
          hint={`${stats.totalCorrections} corr.`}
          tint={colors.warning}
        />
      </View>

      <Text className="text-[13px] font-bold text-ink-muted uppercase tracking-wider mt-6 mb-2">
        Ações rápidas
      </Text>

      <View className="flex-row gap-2">
        <QuickAction
          emoji="🏫"
          label="Nova turma"
          hint="cadastrar"
          onPress={() => navigation.navigate('TurmasTab', { openCreate: true })}
        />
        <QuickAction
          emoji="📝"
          label="Nova avaliação"
          hint="cadastrar"
          onPress={() => navigation.navigate('CreateExam', {})}
        />
      </View>

      {recentExams.length > 0 ? (
        <>
          <View className="flex-row items-center justify-between mt-6 mb-2">
            <Text className="text-[13px] font-bold text-ink-muted uppercase tracking-wider">
              Avaliações recentes
            </Text>
            <Pressable
              onPress={() => navigation.navigate('AvaliacoesTab')}
              hitSlop={8}
              className="active:opacity-60"
            >
              <Text className="text-[12px] text-brand-500 font-semibold">Ver todas</Text>
            </Pressable>
          </View>

          {recentExams.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate('ExamDetail', { examId: item.id })}
              className="bg-bg-surface rounded-2xl p-4 mb-2 active:opacity-85"
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
              <Text className="text-[16px] font-bold text-ink mb-0.5">
                {item.name}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-[12px] text-ink-muted">
                  {item.questions.length} questões
                </Text>
                <View className="w-1 h-1 rounded-full bg-ink-subtle mx-2" />
                <Text className="text-[12px] text-ink-muted">
                  {item.correctionCount} aluno{item.correctionCount === 1 ? '' : 's'}
                </Text>
              </View>
            </Pressable>
          ))}
        </>
      ) : (
        <View className="bg-bg-surface rounded-2xl p-6 mt-6 items-center">
          <Text className="text-[36px] mb-2">📝</Text>
          <Text className="text-[16px] font-bold text-ink mb-1">
            Comece criando uma avaliação
          </Text>
          <Text className="text-[13px] text-ink-muted text-center mb-4">
            Cadastre uma turma e em seguida sua primeira avaliação.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

interface QuickActionProps {
  emoji: string;
  label: string;
  hint: string;
  onPress: () => void;
}

function QuickAction({ emoji, label, hint, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-bg-surface rounded-2xl p-3 active:opacity-85"
    >
      <View className="w-10 h-10 rounded-xl bg-brand-50 items-center justify-center mb-2">
        <Text className="text-[20px]">{emoji}</Text>
      </View>
      <Text className="text-[15px] font-bold text-ink">{label}</Text>
      <Text className="text-[11px] text-ink-subtle mt-0.5">{hint}</Text>
    </Pressable>
  );
}
