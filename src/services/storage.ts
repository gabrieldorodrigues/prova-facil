import AsyncStorage from "@react-native-async-storage/async-storage";
import { Correction, Exam } from "../types";

const ASSESSMENTS_KEY = "@provafacil/assessments";
const CORRECTIONS_KEY = "@provafacil/corrections";

// Legacy key for backward compatibility
const LEGACY_EXAMS_KEY = "@provafacil/exams";

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Migration: Try new key first, then legacy key
async function readAssessments(): Promise<Exam[]> {
  // Try new key first
  let exams = await readJSON<Exam[]>(ASSESSMENTS_KEY, []);

  // If empty, try legacy key and migrate
  if (exams.length === 0) {
    const legacyExams = await readJSON<Exam[]>(LEGACY_EXAMS_KEY, []);
    if (legacyExams.length > 0) {
      // Migrate from legacy key to new key
      await writeJSON(ASSESSMENTS_KEY, legacyExams);
      // Remove legacy key
      await AsyncStorage.removeItem(LEGACY_EXAMS_KEY);
      exams = legacyExams;
    }
  }

  return exams;
}

export const examStorage = {
  async list(): Promise<Exam[]> {
    const exams = await readAssessments();
    return [...exams].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id: string): Promise<Exam | undefined> {
    const all = await readAssessments();
    return all.find((e) => e.id === id);
  },

  async save(exam: Exam): Promise<void> {
    const all = await readAssessments();
    const idx = all.findIndex((e) => e.id === exam.id);
    if (idx >= 0) all[idx] = exam;
    else all.push(exam);
    await writeJSON(ASSESSMENTS_KEY, all);
  },

  async remove(id: string): Promise<void> {
    const all = await readAssessments();
    await writeJSON(
      ASSESSMENTS_KEY,
      all.filter((e) => e.id !== id),
    );
    const corrections = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    await writeJSON(
      CORRECTIONS_KEY,
      corrections.filter((c) => c.examId !== id),
    );
  },
};

export const correctionStorage = {
  async listAll(): Promise<Correction[]> {
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    return [...all].sort((a, b) => b.correctedAt.localeCompare(a.correctedAt));
  },

  async listByExam(examId: string): Promise<Correction[]> {
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    return all
      .filter((c) => c.examId === examId)
      .sort((a, b) => b.correctedAt.localeCompare(a.correctedAt));
  },

  async save(correction: Correction): Promise<void> {
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    const idx = all.findIndex((c) => c.id === correction.id);
    if (idx >= 0) all[idx] = correction;
    else all.push(correction);
    await writeJSON(CORRECTIONS_KEY, all);
  },

  async remove(id: string): Promise<void> {
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    await writeJSON(
      CORRECTIONS_KEY,
      all.filter((c) => c.id !== id),
    );
  },
};
