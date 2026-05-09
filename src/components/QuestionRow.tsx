import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Question, QUESTION_TYPE_LABEL, QuestionType } from '../types';
import { getOptionsForType } from '../utils/grading';
import { colors, elevation, radius, spacing } from '../theme';
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
    <View style={[styles.row, elevation.sm]}>
      <View style={styles.headerRow}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{question.number}</Text>
        </View>
        <Text style={styles.title}>Questão {question.number}</Text>
        <View style={{ flex: 1 }} />
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor={colors.danger}
          onPress={onRemove}
        />
      </View>

      <Text style={styles.fieldLabel}>Tipo de questão</Text>
      <SegmentedButtons
        value={question.type}
        onValueChange={handleTypeChange}
        density="small"
        buttons={[
          { value: 'mc5', label: QUESTION_TYPE_LABEL.mc5 },
          { value: 'mc4', label: QUESTION_TYPE_LABEL.mc4 },
          { value: 'tf', label: QUESTION_TYPE_LABEL.tf },
        ]}
        style={{ marginBottom: spacing.md }}
      />

      <Text style={styles.fieldLabel}>Resposta correta</Text>
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
        style={{ marginTop: spacing.sm }}
        outlineColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  numberText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  fieldLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cells: { flexDirection: 'row', flexWrap: 'wrap' },
});
