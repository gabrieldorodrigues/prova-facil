import { Exam, Question, QuestionType } from '../types';

export interface GradeResult {
  score: number;
  hits: number;
  misses: number;
  perQuestion: { questionId: string; correct: boolean; detected: string; expected: string }[];
}

export function getOptionsForType(type: QuestionType): string[] {
  switch (type) {
    case 'mc5':
      return ['A', 'B', 'C', 'D', 'E'];
    case 'mc4':
      return ['A', 'B', 'C', 'D'];
    case 'tf':
      return ['V', 'F'];
  }
}

export function isValidAnswer(question: Question, value: string): boolean {
  return getOptionsForType(question.type).includes(value.toUpperCase());
}

export function calculateGrade(
  exam: Exam,
  detectedAnswers: Record<string, string>,
): GradeResult {
  const totalWeight = exam.questions.reduce((s, q) => s + q.weight, 0) || 1;
  let weightedHits = 0;
  let hits = 0;
  let misses = 0;
  const perQuestion: GradeResult['perQuestion'] = [];

  for (const q of exam.questions) {
    const detected = (detectedAnswers[q.id] || '').toUpperCase();
    const expected = q.correctAnswer.toUpperCase();
    const correct = detected !== '' && detected !== '?' && detected === expected;
    if (correct) {
      weightedHits += q.weight;
      hits++;
    } else {
      misses++;
    }
    perQuestion.push({ questionId: q.id, correct, detected: detected || '?', expected });
  }

  const score = Math.round((weightedHits / totalWeight) * 100) / 10;
  return { score, hits, misses, perQuestion };
}
