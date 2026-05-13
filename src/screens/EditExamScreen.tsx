import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ClassMultiSelectDialog } from '../components/ClassMultiSelectDialog';
import { QuestionRow } from '../components/QuestionRow';
import { SectionHeader } from '../components/SectionHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { RootStackParamList } from '../navigation/AppNavigator';
import { classStorage, examStorage } from '../services/storage';
import { Class, Exam, Question } from '../types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditExam'>;

function makeQuestion(number: number): Question {
  return {
    id: Crypto.randomUUID(),
    number,
    type: 'mc5',
    correctAnswer: 'A',
    weight: 1,
  };
}

export function EditExamScreen({ route, navigation }: Props) {
  const { examId } = route.params;

  const [name, setName] = useState('');
  const [classIds, setClassIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [original, setOriginal] = useState<Exam | null>(null);
  const { toast } = useToast();
  const [showClassPicker, setShowClassPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await examStorage.get(examId);
      if (!e) {
        navigation.goBack();
        return;
      }
      setOriginal(e);
      setName(e.name);
      setClassIds(e.classIds);
      setQuestions(e.questions);
    })();
  }, [examId, navigation]);

  const loadClasses = useCallback(async () => {
    setClasses(await classStorage.list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses]),
  );

  const selectedClasses = useMemo(
    () => classes.filter((c) => classIds.includes(c.id)),
    [classes, classIds],
  );

  const totalWeight = useMemo(
    () => questions.reduce((s, q) => s + (q.weight || 0), 0),
    [questions],
  );

  const updateQuestion = (idx: number, q: Question) =>
    setQuestions((prev) => prev.map((item, i) => (i === idx ? q : item)));

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) {
      toast('A avaliação precisa de pelo menos uma questão.', 'info', 2200);
      return;
    }
    setQuestions((prev) =>
      prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 })),
    );
  };

  const addQuestion = () =>
    setQuestions((prev) => [...prev, makeQuestion(prev.length + 1)]);

  const distributeEvenly = () => {
    const per = Math.round((10 / questions.length) * 100) / 100;
    setQuestions((prev) => prev.map((q) => ({ ...q, weight: per })));
    toast(`Pesos distribuídos: ${per} por questão.`, 'success', 2200);
  };

  const toggleClass = (id: string) =>
    setClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const removeClassChip = (id: string) =>
    setClassIds((prev) => prev.filter((x) => x !== id));

  const handleSave = async () => {
    if (!original) return;
    if (!name.trim()) return Alert.alert('Atenção', 'Informe o nome da avaliação.');
    if (classIds.length === 0)
      return Alert.alert('Atenção', 'Selecione pelo menos uma turma.');
    if (questions.length === 0)
      return Alert.alert('Atenção', 'Adicione pelo menos uma questão.');
    if (totalWeight <= 0)
      return Alert.alert('Atenção', 'O peso total deve ser maior que zero.');

    const updated: Exam = {
      ...original,
      name: name.trim(),
      classIds,
      questions,
    };
    await examStorage.save(updated);
    navigation.goBack();
  };

  if (!original) return null;

  const isValid = name.trim() && classIds.length > 0 && totalWeight > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-bg-surface rounded-2xl p-4">
          <Text className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">
            Informações da avaliação
          </Text>
          <Input
            label="Nome da avaliação"
            value={name}
            onChangeText={setName}
            containerClasses="mb-3"
          />

          <View className="flex-row justify-between items-baseline mb-2">
            <Text className="text-[12px] font-bold text-ink-muted uppercase tracking-wider">
              Turmas
            </Text>
            <Text className="text-[11px] text-ink-subtle">Edite quando necessário</Text>
          </View>

          {selectedClasses.length === 0 ? (
            <Pressable
              onPress={() => setShowClassPicker(true)}
              className="py-3 px-3 rounded-xl border border-line border-dashed items-center active:opacity-85"
            >
              <Text className="text-[14px] text-ink-subtle font-medium">
                🏫  Adicionar turmas
              </Text>
            </Pressable>
          ) : (
            <View className="flex-row flex-wrap gap-1.5">
              {selectedClasses.map((c) => (
                <View
                  key={c.id}
                  className="flex-row items-center bg-brand-50 pl-2 pr-1 py-1 rounded-full"
                >
                  <Text className="text-brand-700 font-bold text-[13px]">{c.name}</Text>
                  <Pressable
                    onPress={() => removeClassChip(c.id)}
                    hitSlop={8}
                    className="w-5 h-5 rounded-full items-center justify-center ml-1 active:opacity-60"
                  >
                    <Text className="text-brand-700 text-[16px] font-bold leading-4">
                      ×
                    </Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() => setShowClassPicker(true)}
                className="px-2 py-1.5 rounded-full border border-brand border-dashed active:opacity-70"
              >
                <Text className="text-brand-500 font-semibold text-[12px]">
                  ＋ adicionar
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <SectionHeader
          title="Gabarito"
          hint={`${questions.length} questão(ões) • peso total ${totalWeight}`}
        />

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center bg-bg-surface px-3 py-2 rounded-xl">
            <Text className="text-[12px] text-ink-muted mr-2">Soma dos pesos</Text>
            <Text
              className="text-[16px] font-bold"
              style={{
                color:
                  totalWeight === 10
                    ? colors.accent
                    : totalWeight > 0
                    ? colors.warning
                    : colors.danger,
              }}
            >
              {totalWeight}
            </Text>
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={distributeEvenly}
            iconLeft={<Ionicons name="scale-outline" size={16} color={colors.primary} />}
          >
            Distribuir = 10
          </Button>
        </View>

        {questions.map((q, idx) => (
          <QuestionRow
            key={q.id}
            question={q}
            onChange={(updated) => updateQuestion(idx, updated)}
            onRemove={() => removeQuestion(idx)}
          />
        ))}

        <Button
          variant="secondary"
          iconLeft={<Ionicons name="add" size={18} color={colors.primary} />}
          onPress={addQuestion}
          style={{ marginTop: 8 }}
        >
          Adicionar questão
        </Button>

        <Button
          size="lg"
          onPress={handleSave}
          disabled={!isValid}
          iconLeft={<Ionicons name="save-outline" size={18} color="#ffffff" />}
          style={{ marginTop: 24 }}
        >
          Salvar alterações
        </Button>
      </ScrollView>

      <ClassMultiSelectDialog
        visible={showClassPicker}
        onDismiss={() => setShowClassPicker(false)}
        classes={classes}
        selectedIds={classIds}
        onToggle={toggleClass}
      />
    </KeyboardAvoidingView>
  );
}
