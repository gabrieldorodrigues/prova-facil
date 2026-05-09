import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Exam } from '../types';
import { getOptionsForType } from '../utils/grading';

const MODEL =
  process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.1-flash-lite';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class GeminiKeyMissingError extends Error {
  constructor() {
    super('Chave EXPO_PUBLIC_GEMINI_API_KEY não configurada no .env');
    this.name = 'GeminiKeyMissingError';
  }
}

interface GeminiAnswer {
  questionNumber: number;
  marked: string;
}

export interface DetectionResult {
  studentName: string | null;
  studentNameConfidence: 'high' | 'medium' | 'low' | 'none';
  answers: Record<string, string>;
}

export interface BatchDetectionItem {
  photoUri: string;
  result: DetectionResult | null;
  error: string | null;
}

async function compressAndEncode(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  if (result.base64) return result.base64;
  return await FileSystem.readAsStringAsync(result.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

function buildPrompt(exam: Exam, withName: boolean): string {
  const lines = exam.questions
    .map((q) => {
      const opts = getOptionsForType(q.type).join('/');
      return `- Questão ${q.number}: alternativas válidas = [${opts}]`;
    })
    .join('\n');

  const namePart = withName
    ? `

NOME DO ALUNO:
- Procure o nome do aluno escrito no cabeçalho da prova (geralmente em campo "Nome:", "Aluno:" ou similar).
- Retorne o nome em "studentName" exatamente como está escrito.
- Em "studentNameConfidence" use:
  • "high" se está claramente legível.
  • "medium" se está parcialmente legível mas você infere com razoável certeza.
  • "low" se mal consegue ler.
  • "none" se não há nome ou é ilegível.
- Se "none", deixe studentName como string vazia.`
    : '';

  return `Você é um assistente de correção de provas escolares brasileiras.${namePart}

RESPOSTAS:
Para cada questão listada, identifique qual alternativa o aluno marcou.

Regras:
- Use exatamente uma das alternativas válidas listadas abaixo.
- Se a marcação estiver ambígua, rasurada, em branco ou ilegível, use "?".
- Não invente respostas.
- Para questões V/F, "V" = verdadeiro, "F" = falso.

Questões esperadas:
${lines}

Retorne APENAS JSON válido conforme o schema definido.`;
}

function buildResponseSchema(withName: boolean) {
  const properties: Record<string, unknown> = {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionNumber: { type: 'integer' },
          marked: { type: 'string' },
        },
        required: ['questionNumber', 'marked'],
      },
    },
  };
  const required = ['answers'];
  if (withName) {
    properties.studentName = { type: 'string' };
    properties.studentNameConfidence = {
      type: 'string',
      enum: ['high', 'medium', 'low', 'none'],
    };
    required.push('studentName', 'studentNameConfidence');
  }
  return { type: 'object', properties, required };
}

async function callGemini(
  exam: Exam,
  photoUris: string[],
  withName: boolean,
): Promise<DetectionResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new GeminiKeyMissingError();

  const imageParts = await Promise.all(
    photoUris.map(async (uri) => ({
      inline_data: {
        mime_type: 'image/jpeg',
        data: await compressAndEncode(uri),
      },
    })),
  );

  const body = {
    contents: [
      {
        parts: [{ text: buildPrompt(exam, withName) }, ...imageParts],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: buildResponseSchema(withName),
      temperature: 0,
    },
  };

  const res = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API erro ${res.status}: ${errText.slice(0, 240)}`);
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta vazia do Gemini.');

  let parsed: {
    answers?: GeminiAnswer[];
    studentName?: string;
    studentNameConfidence?: 'high' | 'medium' | 'low' | 'none';
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini retornou JSON inválido.');
  }

  const answers: Record<string, string> = {};
  for (const q of exam.questions) answers[q.id] = '?';

  for (const ans of parsed.answers || []) {
    const q = exam.questions.find((qq) => qq.number === ans.questionNumber);
    if (!q) continue;
    const valid = getOptionsForType(q.type);
    const marked = String(ans.marked || '?').toUpperCase().trim();
    answers[q.id] = valid.includes(marked) ? marked : '?';
  }

  return {
    studentName: parsed.studentName?.trim() || null,
    studentNameConfidence: parsed.studentNameConfidence || 'none',
    answers,
  };
}

export async function detectAnswers(
  exam: Exam,
  photoUris: string[],
): Promise<Record<string, string>> {
  const result = await callGemini(exam, photoUris, false);
  return result.answers;
}

export async function detectAnswersAndName(
  exam: Exam,
  photoUris: string[],
): Promise<DetectionResult> {
  return callGemini(exam, photoUris, true);
}

export async function detectBatch(
  exam: Exam,
  photoUris: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<BatchDetectionItem[]> {
  const results: BatchDetectionItem[] = [];
  let done = 0;
  for (const uri of photoUris) {
    try {
      const result = await detectAnswersAndName(exam, [uri]);
      results.push({ photoUri: uri, result, error: null });
    } catch (err) {
      results.push({
        photoUri: uri,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      done++;
      onProgress?.(done, photoUris.length);
    }
  }
  return results;
}
