import AsyncStorage from '@react-native-async-storage/async-storage';
import { examStorage } from './storage';

const TURMAS_KEY = '@provafacil/turmas';
const SEEDED_KEY = '@provafacil/turmas_seeded_from_exams';

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

async function readList(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(TURMAS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

async function writeList(names: string[]): Promise<void> {
  const unique = new Map<string, string>();
  for (const n of names) {
    const t = normalizeName(n);
    if (!t) continue;
    const key = t.toLowerCase();
    if (!unique.has(key)) unique.set(key, t);
  }
  const sorted = [...unique.values()].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
  );
  await AsyncStorage.setItem(TURMAS_KEY, JSON.stringify(sorted));
}

export const turmasStorage = {
  async list(): Promise<string[]> {
    return readList();
  },

  async add(name: string): Promise<string> {
    const t = normalizeName(name);
    if (!t) return '';
    const all = await readList();
    const lower = t.toLowerCase();
    if (!all.some((x) => x.toLowerCase() === lower)) {
      all.push(t);
      await writeList(all);
    }
    const fresh = await readList();
    const found = fresh.find((x) => x.toLowerCase() === lower);
    return found ?? t;
  },

  async remove(name: string): Promise<void> {
    const lower = normalizeName(name).toLowerCase();
    const all = await readList();
    await writeList(all.filter((x) => x.toLowerCase() !== lower));
  },

  /** One-time merge of exam.className values into turmas list (existing installs). */
  async seedFromExamsIfNeeded(): Promise<void> {
    const done = await AsyncStorage.getItem(SEEDED_KEY);
    if (done === '1') return;

    const exams = await examStorage.list();
    const names = exams.map((e) => e.className).filter(Boolean);
    if (names.length === 0) {
      await AsyncStorage.setItem(SEEDED_KEY, '1');
      return;
    }

    const existing = await readList();
    await writeList([...existing, ...names]);
    await AsyncStorage.setItem(SEEDED_KEY, '1');
  },
};
