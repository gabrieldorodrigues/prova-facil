import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Class, Correction, Exam, Student } from '../types';

const CLASSES_KEY = '@provafacil/classes';
const STUDENTS_KEY = '@provafacil/students';
const EXAMS_KEY = '@provafacil/exams';
const CORRECTIONS_KEY = '@provafacil/corrections';
const MIGRATION_KEY = '@provafacil/migration_v2_done';

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

interface LegacyExam extends Omit<Exam, 'classIds'> {
  className?: string;
  classId?: string;
  classIds?: string[];
}

function normalizeExam(raw: LegacyExam | Exam): Exam {
  const e = raw as LegacyExam;
  if (Array.isArray(e.classIds) && e.classIds.length > 0) {
    return {
      id: e.id,
      name: e.name,
      classIds: e.classIds,
      createdAt: e.createdAt,
      questions: e.questions,
    };
  }
  if (e.classId) {
    return {
      id: e.id,
      name: e.name,
      classIds: [e.classId],
      createdAt: e.createdAt,
      questions: e.questions,
    };
  }
  return {
    id: e.id,
    name: e.name,
    classIds: [],
    createdAt: e.createdAt,
    questions: e.questions,
  };
}

interface LegacyCorrection extends Omit<Correction, 'studentId' | 'studentNameRaw' | 'identified'> {
  studentName?: string;
  studentId?: string | null;
  studentNameRaw?: string | null;
  identified?: boolean;
}

async function migrateIfNeeded(): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_KEY);
  if (done === '1') return;

  const legacyExams = await readJSON<LegacyExam[]>(EXAMS_KEY, []);
  const classes = await readJSON<Class[]>(CLASSES_KEY, []);
  const students = await readJSON<Student[]>(STUDENTS_KEY, []);
  const legacyCorrections = await readJSON<LegacyCorrection[]>(CORRECTIONS_KEY, []);

  const classByName = new Map(classes.map((c) => [c.name.toLowerCase(), c]));

  const newExams: Exam[] = [];
  for (const e of legacyExams) {
    if (Array.isArray(e.classIds) && e.classIds.length > 0) {
      newExams.push(normalizeExam(e));
      continue;
    }
    if (e.classId) {
      newExams.push(normalizeExam(e));
      continue;
    }
    const className = e.className || 'Turma';
    let cls = classByName.get(className.toLowerCase());
    if (!cls) {
      cls = {
        id: Crypto.randomUUID(),
        name: className,
        createdAt: new Date().toISOString(),
      };
      classes.push(cls);
      classByName.set(className.toLowerCase(), cls);
    }
    newExams.push({
      id: e.id,
      name: e.name,
      classIds: [cls.id],
      createdAt: e.createdAt,
      questions: e.questions,
    });
  }

  const studentByKey = new Map(
    students.map((s) => [`${s.classId}|${normalizeName(s.name)}`, s]),
  );

  const newCorrections: Correction[] = [];
  for (const c of legacyCorrections) {
    if (typeof c.identified === 'boolean') {
      newCorrections.push(c as Correction);
      continue;
    }
    const exam = newExams.find((e) => e.id === c.examId);
    const rawName = c.studentName || '';
    let studentId: string | null = null;
    if (exam && exam.classIds[0] && rawName.trim()) {
      const examClassId = exam.classIds[0];
      const key = `${examClassId}|${normalizeName(rawName)}`;
      let st = studentByKey.get(key);
      if (!st) {
        st = {
          id: Crypto.randomUUID(),
          classId: examClassId,
          name: rawName.trim(),
          createdAt: new Date().toISOString(),
        };
        students.push(st);
        studentByKey.set(key, st);
      }
      studentId = st.id;
    }
    newCorrections.push({
      id: c.id,
      examId: c.examId,
      studentId,
      studentNameRaw: rawName || null,
      photoUris: c.photoUris,
      detectedAnswers: c.detectedAnswers,
      score: c.score,
      hits: c.hits,
      misses: c.misses,
      correctedAt: c.correctedAt,
      identified: !!studentId,
    });
  }

  await writeJSON(CLASSES_KEY, classes);
  await writeJSON(STUDENTS_KEY, students);
  await writeJSON(EXAMS_KEY, newExams);
  await writeJSON(CORRECTIONS_KEY, newCorrections);
  await AsyncStorage.setItem(MIGRATION_KEY, '1');
}

let migrationPromise: Promise<void> | null = null;
async function ensureMigrated(): Promise<void> {
  if (!migrationPromise) migrationPromise = migrateIfNeeded();
  await migrationPromise;
}

export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findStudentByName(
  rawName: string,
  classStudents: Student[],
): Student | null {
  if (!rawName.trim()) return null;
  const target = normalizeName(rawName);
  if (!target) return null;

  const exact = classStudents.find((s) => normalizeName(s.name) === target);
  if (exact) return exact;

  const targetTokens = target.split(' ').filter((t) => t.length >= 3);
  if (targetTokens.length === 0) return null;

  let bestMatch: { student: Student; score: number } | null = null;
  for (const s of classStudents) {
    const studentTokens = normalizeName(s.name).split(' ').filter((t) => t.length >= 3);
    if (studentTokens.length === 0) continue;
    const overlap = targetTokens.filter((t) => studentTokens.includes(t)).length;
    if (overlap === 0) continue;
    const score = overlap / Math.max(targetTokens.length, studentTokens.length);
    if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { student: s, score };
    }
  }
  return bestMatch?.student ?? null;
}

export const classStorage = {
  async list(): Promise<Class[]> {
    await ensureMigrated();
    const all = await readJSON<Class[]>(CLASSES_KEY, []);
    return [...all].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  async get(id: string): Promise<Class | undefined> {
    await ensureMigrated();
    const all = await readJSON<Class[]>(CLASSES_KEY, []);
    return all.find((c) => c.id === id);
  },

  async save(cls: Class): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Class[]>(CLASSES_KEY, []);
    const idx = all.findIndex((c) => c.id === cls.id);
    if (idx >= 0) all[idx] = cls;
    else all.push(cls);
    await writeJSON(CLASSES_KEY, all);
  },

  async remove(id: string): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Class[]>(CLASSES_KEY, []);
    await writeJSON(CLASSES_KEY, all.filter((c) => c.id !== id));

    const students = await readJSON<Student[]>(STUDENTS_KEY, []);
    await writeJSON(STUDENTS_KEY, students.filter((s) => s.classId !== id));

    const rawExams = await readJSON<LegacyExam[]>(EXAMS_KEY, []);
    const exams = rawExams.map(normalizeExam);
    const updatedExams = exams
      .map((e) => ({ ...e, classIds: e.classIds.filter((cid) => cid !== id) }));
    const removedExamIds = updatedExams
      .filter((e) => e.classIds.length === 0)
      .map((e) => e.id);
    await writeJSON(
      EXAMS_KEY,
      updatedExams.filter((e) => e.classIds.length > 0),
    );

    const corrections = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    await writeJSON(
      CORRECTIONS_KEY,
      corrections.filter((c) => !removedExamIds.includes(c.examId)),
    );
  },
};

export const studentStorage = {
  async listByClass(classId: string): Promise<Student[]> {
    await ensureMigrated();
    const all = await readJSON<Student[]>(STUDENTS_KEY, []);
    return all
      .filter((s) => s.classId === classId)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  async get(id: string): Promise<Student | undefined> {
    await ensureMigrated();
    const all = await readJSON<Student[]>(STUDENTS_KEY, []);
    return all.find((s) => s.id === id);
  },

  async save(st: Student): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Student[]>(STUDENTS_KEY, []);
    const idx = all.findIndex((s) => s.id === st.id);
    if (idx >= 0) all[idx] = st;
    else all.push(st);
    await writeJSON(STUDENTS_KEY, all);
  },

  async remove(id: string): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Student[]>(STUDENTS_KEY, []);
    await writeJSON(STUDENTS_KEY, all.filter((s) => s.id !== id));
    const corrections = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    const updated = corrections.map((c) =>
      c.studentId === id ? { ...c, studentId: null, identified: false } : c,
    );
    await writeJSON(CORRECTIONS_KEY, updated);
  },
};

export const examStorage = {
  async list(): Promise<Exam[]> {
    await ensureMigrated();
    const raw = await readJSON<LegacyExam[]>(EXAMS_KEY, []);
    return raw
      .map(normalizeExam)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listByClass(classId: string): Promise<Exam[]> {
    const all = await this.list();
    return all.filter((e) => e.classIds.includes(classId));
  },

  async get(id: string): Promise<Exam | undefined> {
    await ensureMigrated();
    const raw = await readJSON<LegacyExam[]>(EXAMS_KEY, []);
    const found = raw.find((e) => e.id === id);
    return found ? normalizeExam(found) : undefined;
  },

  async save(exam: Exam): Promise<void> {
    await ensureMigrated();
    const raw = await readJSON<LegacyExam[]>(EXAMS_KEY, []);
    const all = raw.map(normalizeExam);
    const idx = all.findIndex((e) => e.id === exam.id);
    if (idx >= 0) all[idx] = exam;
    else all.push(exam);
    await writeJSON(EXAMS_KEY, all);
  },

  async remove(id: string): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Exam[]>(EXAMS_KEY, []);
    await writeJSON(EXAMS_KEY, all.filter((e) => e.id !== id));
    const corrections = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    await writeJSON(CORRECTIONS_KEY, corrections.filter((c) => c.examId !== id));
  },
};

export const correctionStorage = {
  async get(id: string): Promise<Correction | undefined> {
    await ensureMigrated();
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    return all.find((c) => c.id === id);
  },

  async listByExam(examId: string): Promise<Correction[]> {
    await ensureMigrated();
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    return all
      .filter((c) => c.examId === examId)
      .sort((a, b) => b.correctedAt.localeCompare(a.correctedAt));
  },

  async listByStudent(studentId: string): Promise<Correction[]> {
    await ensureMigrated();
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    return all
      .filter((c) => c.studentId === studentId)
      .sort((a, b) => b.correctedAt.localeCompare(a.correctedAt));
  },

  async save(correction: Correction): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    const idx = all.findIndex((c) => c.id === correction.id);
    if (idx >= 0) all[idx] = correction;
    else all.push(correction);
    await writeJSON(CORRECTIONS_KEY, all);
  },

  async saveMany(corrections: Correction[]): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    const map = new Map(all.map((c) => [c.id, c]));
    for (const c of corrections) map.set(c.id, c);
    await writeJSON(CORRECTIONS_KEY, Array.from(map.values()));
  },

  async remove(id: string): Promise<void> {
    await ensureMigrated();
    const all = await readJSON<Correction[]>(CORRECTIONS_KEY, []);
    await writeJSON(CORRECTIONS_KEY, all.filter((c) => c.id !== id));
  },
};
