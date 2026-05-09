import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Question, QUESTION_TYPE_LABEL, QuestionType } from '../types';
import { getOptionsForType } from '../utils/grading';
import { AnswerCell } from './AnswerCell';

interface Props {
  question: Question;
  onChange: (q: Question) => void;
  onRemove: () => void;
}

export function QuestionRow({ question, onChange, onRemove }: Props) {
  const options = getOptionsForType(question.type);

  const handleTypeChange = (type: string) => {
    const newType = type as QuestionType;
    const newOpts = getOptionsForType(newType);
    const stillValid = newOpts.includes(question.correctAnswer);
    onChange({
      ...question,
      type: newType,
      correctAnswer: stillValid ? question.correctAnswer : newOpts[0],
    });
  };

  const handleAnswer = (label: string) => onChange({ ...question, correctAnswer: label });

  const handleWeight = (text: string) => {
    const cleaned = text.replace(',', '.');
    const num = parseFloat(cleaned);
    onChange({ ...question, weight: Number.isFinite(num) ? num : 0 });
  };

  return (
    <View style={styles.row}>
      <View style={styles.headerRow}>
        <Text variant="titleMedium">Questão {question.number}</Text>
        <IconButton icon="delete-outline" size={20} onPress={onRemove} />
      </View>

      <SegmentedButtons
        value={question.type}
        onValueChange={handleTypeChange}
        density="small"
        buttons={[
          { value: 'mc5', label: QUESTION_TYPE_LABEL.mc5 },
          { value: 'mc4', label: QUESTION_TYPE_LABEL.mc4 },
          { value: 'tf', label: QUESTION_TYPE_LABEL.tf },
        ]}
        style={{ marginBottom: 12 }}
      />

      <Text variant="labelMedium" style={styles.label}>
        Resposta correta
      </Text>
      <View style={styles.cells}>
        {options.map((opt) => (
          <AnswerCell
            key={opt}
            label={opt}
            variant={question.correctAnswer === opt ? 'correct' : 'default'}
            onPress={() => handleAnswer(opt)}
          />
        ))}
      </View>

      <TextInput
        label="Peso"
        mode="outlined"
        dense
        keyboardType="decimal-pad"
        value={String(question.weight)}
        onChangeText={handleWeight}
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { marginBottom: 6, color: '#4b5563' },
  cells: { flexDirection: 'row', flexWrap: 'wrap' },
});
