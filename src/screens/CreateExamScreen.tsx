import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { QuestionRow } from '../components/QuestionRow';
import { RootStackParamList } from '../navigation/AppNavigator';
import { examStorage } from '../services/storage';
import { Exam, Question } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateExam'>;

function makeQuestion(number: number): Question {
  return {
    id: Crypto.randomUUID(),
    number,
    type: 'mc5',
    correctAnswer: 'A',
    weight: 1,
  };
}

export function CreateExamScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([makeQuestion(1)]);

  const totalWeight = useMemo(
    () => questions.reduce((s, q) => s + (q.weight || 0), 0),
    [questions],
  );

  const updateQuestion = (idx: number, q: Question) =>
    setQuestions((prev) => prev.map((item, i) => (i === idx ? q : item)));

  const removeQuestion = (idx: number) =>
    setQuestions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, number: i + 1 })),
    );

  const addQuestion = () =>
    setQuestions((prev) => [...prev, makeQuestion(prev.length + 1)]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Atenção', 'Informe o nome da prova.');
    if (!className.trim()) return Alert.alert('Atenção', 'Informe a turma.');
    if (questions.length === 0) return Alert.alert('Atenção', 'Adicione pelo menos uma questão.');
    if (totalWeight <= 0) return Alert.alert('Atenção', 'O peso total deve ser maior que zero.');

    const exam: Exam = {
      id: Crypto.randomUUID(),
      name: name.trim(),
      className: className.trim(),
      createdAt: new Date().toISOString(),
      questions,
    };
    await examStorage.save(exam);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label="Nome da prova"
          mode="outlined"
          value={name}
          onChangeText={setName}
          style={styles.field}
          placeholder="Ex.: Matemática 1º Bimestre"
        />
        <TextInput
          label="Turma"
          mode="outlined"
          value={className}
          onChangeText={setClassName}
          style={styles.field}
          placeholder="Ex.: 9A"
        />

        <Divider style={{ marginVertical: 12 }} />

        <View style={styles.headerRow}>
          <Text variant="titleMedium">Questões</Text>
          <Text style={{ color: '#6b7280' }}>Soma dos pesos: {totalWeight}</Text>
        </View>

        {questions.map((q, idx) => (
          <QuestionRow
            key={q.id}
            question={q}
            onChange={(updated) => updateQuestion(idx, updated)}
            onRemove={() => removeQuestion(idx)}
          />
        ))}

        <Button mode="outlined" icon="plus" onPress={addQuestion} style={{ marginTop: 8 }}>
          Adicionar questão
        </Button>

        <Button
          mode="contained"
          onPress={handleSave}
          style={{ marginTop: 24 }}
          contentStyle={{ paddingVertical: 6 }}
        >
          Salvar prova
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  field: { marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});
