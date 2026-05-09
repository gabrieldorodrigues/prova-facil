export type QuestionType = 'mc5' | 'mc4' | 'tf';

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  correctAnswer: string;
  weight: number;
}

export interface Exam {
  id: string;
  name: string;
  className: string;
  createdAt: string;
  questions: Question[];
}

export interface Correction {
  id: string;
  examId: string;
  studentName: string;
  photoUris: string[];
  detectedAnswers: Record<string, string>;
  score: number;
  hits: number;
  misses: number;
  correctedAt: string;
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  mc5: 'Múltipla A-E',
  mc4: 'Múltipla A-D',
  tf: 'V/F',
};
