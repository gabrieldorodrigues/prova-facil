import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { AnswerCell } from '../components/AnswerCell';
import { EmptyState } from '../components/EmptyState';
import { ScoreBadge } from '../components/ScoreBadge';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/ui/Button';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '../components/ui/Dialog';
import { IconButton } from '../components/ui/IconButton';
import { useToast } from '../components/ui/Toast';
import { RootStackParamList } from '../navigation/AppNavigator';
import { exportCorrectionsCSV } from '../services/csvExport';
import {
  classStorage,
  correctionStorage,
  examStorage,
  studentStorage,
} from '../services/storage';
import { Class, Correction, Exam, QUESTION_TYPE_LABEL, Student } from '../types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExamDetail'>;

interface ClassGroup {
  cls: Class;
  students: Student[];
  corrections: Correction[];
  avg: number | null;
  passing: number;
}

export function ExamDetailScreen({ route, navigation }: Props) {
  const { examId } = route.params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const e = await examStorage.get(examId);
    if (!e) {
      navigation.goBack();
      return;
    }
    setExam(e);
    const cls: Class[] = [];
    const sts: Student[] = [];
    for (const cid of e.classIds) {
      const c = await classStorage.get(cid);
      if (c) {
        cls.push(c);
        sts.push(...(await studentStorage.listByClass(cid)));
      }
    }
    setClasses(cls);
    setAllStudents(sts);
    setCorrections(await correctionStorage.listByExam(examId));
  }, [examId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const studentMap = useMemo(
    () => new Map(allStudents.map((s) => [s.id, s])),
    [allStudents],
  );

  const groups = useMemo<ClassGroup[]>(() => {
    if (!exam) return [];
    return classes.map((cls) => {
      const studentsOfClass = allStudents.filter((s) => s.classId === cls.id);
      const studentIds = new Set(studentsOfClass.map((s) => s.id));
      const corrs = corrections.filter(
        (c) => c.studentId && studentIds.has(c.studentId),
      );
      const scores = corrs.map((c) => c.score);
      const avg = scores.length
        ? scores.reduce((s, v) => s + v, 0) / scores.length
        : null;
      const passing = scores.filter((s) => s >= 7).length;
      return { cls, students: studentsOfClass, corrections: corrs, avg, passing };
    });
  }, [exam, classes, allStudents, corrections]);

  const orphanCorrections = useMemo(() => {
    return corrections.filter((c) => {
      if (!c.studentId) return true;
      const st = studentMap.get(c.studentId);
      return !st;
    });
  }, [corrections, studentMap]);

  const overallStats = useMemo(() => {
    if (corrections.length === 0) return null;
    const scores = corrections.map((c) => c.score);
    return {
      avg: scores.reduce((s, v) => s + v, 0) / scores.length,
      best: Math.max(...scores),
      passing: scores.filter((s) => s >= 7).length,
      total: corrections.length,
    };
  }, [corrections]);

  if (!exam) return null;

  const handleExport = async () => {
    if (corrections.length === 0) {
      toast('Corrija pelo menos um aluno antes de exportar.', 'info', 2400);
      return;
    }
    try {
      await exportCorrectionsCSV(exam, classes, corrections, allStudents);
    } catch (err) {
      Alert.alert('Erro ao exportar', String(err));
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await examStorage.remove(examId);
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="bg-bg-surface rounded-2xl p-4">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-row flex-wrap flex-1 gap-1.5">
              {classes.length === 0 ? (
                <View className="bg-bg-muted px-2 py-1 rounded-md">
                  <Text className="text-ink-subtle text-[11px] font-bold">
                    sem turma
                  </Text>
                </View>
              ) : (
                classes.map((c) => (
                  <View
                    key={c.id}
                    className="bg-brand-50 px-2 py-1 rounded-md"
                  >
                    <Text className="text-brand-700 text-[11px] font-bold">
                      {c.name}
                    </Text>
                  </View>
                ))
              )}
            </View>
            <View className="flex-row -my-1">
              <IconButton
                icon="pencil-outline"
                size={20}
                color={colors.primary}
                accessibilityLabel="Editar prova"
                onPress={() => navigation.navigate('EditExam', { examId })}
              />
              <IconButton
                icon="trash-outline"
                size={20}
                color={colors.danger}
                accessibilityLabel="Excluir prova"
                onPress={() => setConfirmDelete(true)}
              />
            </View>
          </View>
          <Text className="text-[22px] font-extrabold text-ink -tracking-[0.4px]">
            {exam.name}
          </Text>
          <Text className="text-[13px] text-ink-muted mt-1">
            {exam.questions.length} questões •{' '}
            {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {overallStats ? (
          <View className="flex-row mt-3">
            <StatCard
              label="Média"
              value={overallStats.avg.toFixed(1).replace('.', ',')}
              hint="geral"
              tint={colors.primary}
            />
            <View className="w-2" />
            <StatCard
              label="Melhor"
              value={overallStats.best.toFixed(1).replace('.', ',')}
              hint={`${overallStats.total} provas`}
              tint={colors.accent}
            />
            <View className="w-2" />
            <StatCard
              label="Aprovados"
              value={`${overallStats.passing}/${overallStats.total}`}
              hint="≥ 7,0"
              tint={colors.warning}
            />
          </View>
        ) : null}

        <View className="mt-4 gap-1">
          <View className="flex-row items-center">
            <Button
              iconLeft={<Ionicons name="sparkles-outline" size={18} color="#ffffff" />}
              onPress={() => navigation.navigate('BatchCapture', { examId })}
              style={{ flex: 1 }}
            >
              Corrigir em lote
            </Button>
            <View className="w-2" />
            <Button
              variant="secondary"
              iconLeft={<Ionicons name="download-outline" size={18} color={colors.primary} />}
              onPress={handleExport}
            >
              CSV
            </Button>
          </View>

          <Button
            variant="ghost"
            iconLeft={<Ionicons name="person-add-outline" size={18} color="#475569" />}
            labelClasses="text-ink-muted"
            onPress={() => navigation.navigate('Capture', { examId })}
          >
            Corrigir um aluno por vez
          </Button>
        </View>

        <SectionHeader title="Gabarito oficial" hint="Resposta correta de cada questão" />

        <View className="bg-bg-surface rounded-2xl overflow-hidden">
          {exam.questions.map((q, idx) => (
            <View
              key={q.id}
              className={`flex-row items-center p-3 ${
                idx > 0 ? 'border-t border-line' : ''
              }`}
            >
              <View className="w-8 h-8 rounded-md bg-brand-50 items-center justify-center mr-3">
                <Text className="text-brand-700 font-bold text-[14px]">
                  {q.number}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[13px] text-ink font-semibold">
                  {QUESTION_TYPE_LABEL[q.type]}
                </Text>
                <Text className="text-[11px] text-ink-subtle mt-0.5">
                  peso {q.weight}
                </Text>
              </View>
              <AnswerCell label={q.correctAnswer} variant="correct" size={36} />
            </View>
          ))}
        </View>

        <SectionHeader
          title="Correções por turma"
          hint={
            corrections.length === 0
              ? 'Nenhum aluno corrigido ainda'
              : `${corrections.length} prova(s) corrigida(s)`
          }
        />

        {corrections.length === 0 ? (
          <EmptyState
            emoji="📸"
            title="Pronto para corrigir"
            description="Use 'Corrigir em lote' para enviar várias provas de uma vez ou corrija um aluno por vez."
          />
        ) : (
          <>
            {groups.map((g) => (
              <ClassGroupView
                key={g.cls.id}
                group={g}
                studentMap={studentMap}
              />
            ))}
            {orphanCorrections.length > 0 ? (
              <OrphanGroup corrections={orphanCorrections} />
            ) : null}
          </>
        )}
      </ScrollView>

      <Dialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <DialogTitle>Excluir prova?</DialogTitle>
        <DialogContent>
          <Text className="text-[14px] text-ink-muted">
            Esta ação remove a prova e todas as correções dos alunos. Não é possível
            desfazer.
          </Text>
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onPress={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onPress={handleDelete}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </View>
  );
}

function ClassGroupView({
  group,
  studentMap,
}: {
  group: ClassGroup;
  studentMap: Map<string, Student>;
}) {
  return (
    <View className="mt-3">
      <View className="flex-row items-center py-2 px-1 gap-3">
        <View className="w-9 h-9 rounded-md bg-brand-50 items-center justify-center">
          <Text className="text-brand-700 font-extrabold text-[14px]">
            {group.cls.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink">{group.cls.name}</Text>
          <Text className="text-[12px] text-ink-subtle mt-0.5">
            {group.corrections.length} de {group.students.length} aluno(s)
          </Text>
        </View>
        {group.avg !== null ? (
          <View className="bg-brand-50 px-2 py-1 rounded-lg items-center">
            <Text className="text-brand-700 text-[9px] font-bold uppercase tracking-wider">
              média
            </Text>
            <Text className="text-brand-700 text-[14px] font-extrabold">
              {group.avg.toFixed(1).replace('.', ',')}
            </Text>
          </View>
        ) : null}
      </View>

      {group.corrections.length === 0 ? (
        <View className="bg-bg-surface rounded-2xl p-5 items-center">
          <Text className="text-[13px] text-ink-subtle">
            Nenhuma correção desta turma ainda.
          </Text>
        </View>
      ) : (
        <View className="bg-bg-surface rounded-2xl overflow-hidden">
          {group.corrections.map((c, idx) => {
            const st = c.studentId ? studentMap.get(c.studentId) : null;
            const displayName = st?.name ?? c.studentNameRaw ?? 'Aluno';
            return (
              <View
                key={c.id}
                className={`flex-row items-center p-3 gap-3 ${
                  idx > 0 ? 'border-t border-line' : ''
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-brand items-center justify-center">
                  <Text className="text-white font-bold text-[16px]">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-ink">
                    {displayName}
                  </Text>
                  <Text className="text-[12px] text-ink-subtle mt-0.5">
                    {c.hits} acertos • {c.misses} erros •{' '}
                    {new Date(c.correctedAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <ScoreBadge score={c.score} size="md" />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function OrphanGroup({ corrections }: { corrections: Correction[] }) {
  return (
    <View className="mt-3">
      <View className="flex-row items-center py-2 px-1 gap-3">
        <View
          className="w-9 h-9 rounded-md items-center justify-center"
          style={{ backgroundColor: colors.warning }}
        >
          <Text className="text-white font-extrabold text-[14px]">?</Text>
        </View>
        <View className="flex-1">
          <Text
            className="text-[15px] font-bold"
            style={{ color: colors.warning }}
          >
            Sem aluno identificado
          </Text>
          <Text className="text-[12px] text-ink-subtle mt-0.5">
            {corrections.length} correção(ões) sem vínculo
          </Text>
        </View>
      </View>
      <View className="bg-bg-surface rounded-2xl overflow-hidden">
        {corrections.map((c, idx) => (
          <View
            key={c.id}
            className={`flex-row items-center p-3 gap-3 ${
              idx > 0 ? 'border-t border-line' : ''
            }`}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.warning }}
            >
              <Text className="text-white font-bold text-[16px]">?</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-ink">
                {c.studentNameRaw ?? 'Aluno não identificado'}
              </Text>
              <Text className="text-[12px] text-ink-subtle mt-0.5">
                {c.hits} acertos • {c.misses} erros •{' '}
                {new Date(c.correctedAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <ScoreBadge score={c.score} size="md" />
          </View>
        ))}
      </View>
    </View>
  );
}
