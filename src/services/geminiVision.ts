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

function buildPrompt(exam: Exam): string {
  const lines = exam.questions
    .map((q) => {
      const opts = getOptionsForType(q.type).join('/');
      return `- Questão ${q.number}: alternativas válidas = [${opts}]`;
    })
    .join('\n');

  return `Você é um assistente de correção de provas escolares. As imagens abaixo mostram a folha de respostas de um aluno.
Para cada questão listada, identifique qual alternativa o aluno marcou.

Regras:
- Use exatamente uma das alternativas válidas listadas abaixo.
- Se a marcação estiver ambígua, rasurada, em branco ou não for possível identificar com confiança, retorne "?".
- Não invente respostas.
- Para questões V/F, "V" = verdadeiro, "F" = falso.

Questões esperadas:
${lines}

Retorne APENAS JSON válido conforme o schema definido.`;
}

export async function detectAnswers(
  exam: Exam,
  photoUris: string[],
): Promise<Record<string, string>> {
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
        parts: [{ text: buildPrompt(exam) }, ...imageParts],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
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
        },
        required: ['answers'],
      },
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

  let parsed: { answers?: GeminiAnswer[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini retornou JSON inválido.');
  }

  const result: Record<string, string> = {};
  for (const q of exam.questions) result[q.id] = '?';

  for (const ans of parsed.answers || []) {
    const q = exam.questions.find((qq) => qq.number === ans.questionNumber);
    if (!q) continue;
    const valid = getOptionsForType(q.type);
    const marked = String(ans.marked || '?').toUpperCase().trim();
    result[q.id] = valid.includes(marked) ? marked : '?';
  }

  return result;
}
