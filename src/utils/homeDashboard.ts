import { Correction, Exam } from "../types";

export type TurmaDashboardRow = {
  key: string;
  label: string;
  examCount: number;
  correctionCount: number;
  avgScore: number | null;
  lastCorrectionAt: string | null;
};

export function normalizeTurmaKey(name: string): string {
  const t = name.trim();
  return t ? t.toLowerCase() : "sem turma";
}

/** Média aritmética de todas as correções (ponderada implicitamente pelo nº de alunos). */
export function averageOfAllCorrections(
  corrections: Correction[],
): number | null {
  if (!corrections.length) return null;
  return corrections.reduce((s, c) => s + c.score, 0) / corrections.length;
}

export type ExamGradeRowForTurma = {
  examId: string;
  examName: string;
  correctionCount: number;
  avgScore: number;
};

/** Correções atribuídas à turma (mesma regra do painel: className da correção ou da avaliação). */
export function buildTurmaGradeDetail(
  turmaLabel: string,
  exams: Exam[],
  corrections: Correction[],
): {
  overallAvg: number | null;
  correctionCount: number;
  byExam: ExamGradeRowForTurma[];
} {
  const turmaKey = normalizeTurmaKey(turmaLabel);
  const examById = new Map(exams.map((e) => [e.id, e]));

  const relevant = corrections.filter((c) => {
    const ex = examById.get(c.examId);
    const raw = (c.className?.trim() || ex?.className?.trim() || "").trim();
    return normalizeTurmaKey(raw) === turmaKey;
  });

  const overallAvg = relevant.length
    ? relevant.reduce((s, c) => s + c.score, 0) / relevant.length
    : null;

  const scoresByExam = new Map<string, number[]>();
  for (const c of relevant) {
    const arr = scoresByExam.get(c.examId) ?? [];
    arr.push(c.score);
    scoresByExam.set(c.examId, arr);
  }

  const byExam: ExamGradeRowForTurma[] = [...scoresByExam.entries()].map(
    ([examId, scores]) => {
      const ex = examById.get(examId);
      return {
        examId,
        examName: ex?.name ?? "Avaliação",
        correctionCount: scores.length,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      };
    },
  );

  byExam.sort((a, b) => {
    const ea = examById.get(a.examId);
    const eb = examById.get(b.examId);
    return (eb?.createdAt ?? "").localeCompare(ea?.createdAt ?? "");
  });

  return { overallAvg, correctionCount: relevant.length, byExam };
}

function displayLabel(raw: string, fallback: string): string {
  const t = raw.trim();
  return t || fallback;
}

/**
 * Agrega avaliações e correções por turma (chave case-insensitive).
 * `className` da correção tem prioridade; senão usa a turma da avaliação.
 */
export function buildTurmaDashboardRows(
  exams: Exam[],
  corrections: Correction[],
): TurmaDashboardRow[] {
  const examById = new Map(exams.map((e) => [e.id, e]));

  const agg = new Map<
    string,
    {
      label: string;
      examIds: Set<string>;
      scores: number[];
      lastAt: string | null;
    }
  >();

  const ensure = (key: string, preferredLabel: string) => {
    if (!agg.has(key)) {
      agg.set(key, {
        label: preferredLabel,
        examIds: new Set(),
        scores: [],
        lastAt: null,
      });
    }
    return agg.get(key)!;
  };

  for (const e of exams) {
    const key = normalizeTurmaKey(e.className);
    const label = displayLabel(e.className, "Sem turma");
    const g = ensure(key, label);
    if (g.label === "Sem turma" && label !== "Sem turma") g.label = label;
    g.examIds.add(e.id);
  }

  for (const c of corrections) {
    const exam = examById.get(c.examId);
    const fromCorrection = c.className?.trim() ?? "";
    const fromExam = exam?.className?.trim() ?? "";
    const label = displayLabel(fromCorrection || fromExam, "Sem turma");
    const key = normalizeTurmaKey(fromCorrection || fromExam);
    const g = ensure(key, label);
    if (g.label === "Sem turma" && label !== "Sem turma") g.label = label;
    g.scores.push(c.score);
    if (!g.lastAt || c.correctedAt > g.lastAt) g.lastAt = c.correctedAt;
  }

  const rows: TurmaDashboardRow[] = [...agg.entries()].map(([key, v]) => ({
    key,
    label: v.label,
    examCount: v.examIds.size,
    correctionCount: v.scores.length,
    avgScore: v.scores.length
      ? v.scores.reduce((a, b) => a + b, 0) / v.scores.length
      : null,
    lastCorrectionAt: v.lastAt,
  }));

  rows.sort((a, b) => {
    if (b.correctionCount !== a.correctionCount)
      return b.correctionCount - a.correctionCount;
    if (b.examCount !== a.examCount) return b.examCount - a.examCount;
    return a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" });
  });

  return rows;
}

export function countCorrectionsByExam(
  corrections: Correction[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of corrections) {
    m.set(c.examId, (m.get(c.examId) ?? 0) + 1);
  }
  return m;
}
