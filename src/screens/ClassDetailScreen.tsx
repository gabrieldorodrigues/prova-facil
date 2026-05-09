import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Dialog, IconButton, Portal, Text, TextInput } from 'react-native-paper';
import { EmptyState } from '../components/EmptyState';
import { SectionHeader } from '../components/SectionHeader';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  classStorage,
  examStorage,
  studentStorage,
} from '../services/storage';
import { Class, Exam, Student } from '../types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ClassDetail'>;

export function ClassDetailScreen({ route, navigation }: Props) {
  const { classId } = route.params;
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showDeleteCls, setShowDeleteCls] = useState(false);
  const [studentName, setStudentName] = useState('');

  const load = useCallback(async () => {
    const c = await classStorage.get(classId);
    if (!c) {
      navigation.goBack();
      return;
    }
    setCls(c);
    setStudents(await studentStorage.listByClass(classId));
    setExams(await examStorage.listByClass(classId));
  }, [classId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!cls) return null;

  const handleAddStudent = async () => {
    const name = studentName.trim();
    if (!name) return;
    await studentStorage.save({
      id: Crypto.randomUUID(),
      classId,
      name,
      createdAt: new Date().toISOString(),
    });
    setStudentName('');
    setShowAddStudent(false);
    load();
  };

  const handleRemoveStudent = async (id: string) => {
    await studentStorage.remove(id);
    load();
  };

  const handleDeleteClass = async () => {
    setShowDeleteCls(false);
    await classStorage.remove(classId);
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View className="bg-bg-surface rounded-2xl p-3 flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-xl bg-brand-50 items-center justify-center">
            <Text className="text-brand-700 font-extrabold text-[20px]">
              {cls.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[20px] font-extrabold text-ink">{cls.name}</Text>
            <Text className="text-[12px] text-ink-subtle mt-0.5">
              {students.length} aluno{students.length === 1 ? '' : 's'} •{' '}
              {exams.length} prova{exams.length === 1 ? '' : 's'}
            </Text>
          </View>
          <IconButton
            icon="trash-can-outline"
            size={20}
            iconColor={colors.danger}
            onPress={() => setShowDeleteCls(true)}
          />
        </View>

        <SectionHeader
          title="Alunos"
          right={
            students.length > 0 ? (
              <Button
                mode="contained-tonal"
                compact
                icon="plus"
                onPress={() => setShowAddStudent(true)}
              >
                Adicionar
              </Button>
            ) : null
          }
        />

        {students.length === 0 ? (
          <EmptyState
            emoji="👥"
            title="Nenhum aluno ainda"
            description="Adicione os alunos da turma para reaproveitá-los em todas as avaliações."
            actionLabel="Adicionar aluno"
            onAction={() => setShowAddStudent(true)}
          />
        ) : (
          <View className="bg-bg-surface rounded-2xl overflow-hidden">
            {students.map((s, idx) => (
              <View
                key={s.id}
                className={`flex-row items-center p-3 gap-3 ${
                  idx > 0 ? 'border-t border-line' : ''
                }`}
              >
                <View className="w-9 h-9 rounded-full bg-brand-50 items-center justify-center">
                  <Text className="text-brand-700 font-bold">
                    {s.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="flex-1 text-[15px] font-semibold text-ink">
                  {s.name}
                </Text>
                <Pressable
                  onPress={() => handleRemoveStudent(s.id)}
                  hitSlop={8}
                  className="active:opacity-50"
                >
                  <Text className="text-danger-500 text-[13px] font-semibold">
                    Remover
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <SectionHeader
          title="Provas atribuídas"
          hint={
            exams.length === 0
              ? 'Nenhuma prova vinculada a esta turma'
              : `${exams.length} prova(s) atribuída(s)`
          }
        />

        {exams.length === 0 ? (
          <View className="bg-bg-surface rounded-2xl p-6 items-center">
            <Text className="text-[28px] mb-2">📭</Text>
            <Text className="text-[14px] text-ink-muted text-center">
              As provas atribuídas a esta turma aparecem aqui.
            </Text>
          </View>
        ) : (
          <View className="bg-bg-surface rounded-2xl overflow-hidden">
            {exams.map((e, idx) => (
              <Pressable
                key={e.id}
                className={`flex-row items-center p-3 active:bg-bg-muted ${
                  idx > 0 ? 'border-t border-line' : ''
                }`}
                onPress={() => navigation.navigate('ExamDetail', { examId: e.id })}
              >
                <View className="w-9 h-9 rounded-lg bg-brand-50 items-center justify-center mr-3">
                  <Text className="text-brand-700 font-bold text-[15px]">📝</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-ink">{e.name}</Text>
                  <Text className="text-[12px] text-ink-subtle mt-0.5">
                    {e.questions.length} questões •{' '}
                    {new Date(e.createdAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <Text className="text-[22px] text-ink-subtle">›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showAddStudent} onDismiss={() => setShowAddStudent(false)}>
          <Dialog.Title>Novo aluno</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome do aluno"
              mode="outlined"
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Ex.: João Silva"
              autoFocus
              autoCapitalize="words"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddStudent(false)}>Cancelar</Button>
            <Button onPress={handleAddStudent} disabled={!studentName.trim()}>
              Adicionar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showDeleteCls} onDismiss={() => setShowDeleteCls(false)}>
          <Dialog.Title>Excluir turma?</Dialog.Title>
          <Dialog.Content>
            <Text>
              Esta ação remove a turma e todos os alunos. As provas que pertencem a
              outras turmas continuam, mas perderão a vinculação com esta.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteCls(false)}>Cancelar</Button>
            <Button textColor={colors.danger} onPress={handleDeleteClass}>
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
