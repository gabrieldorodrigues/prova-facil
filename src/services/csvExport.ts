import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Class, Correction, Exam, Student } from '../types';

function escapeCell(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function safeName(value: string): string {
  return value.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'turma';
}

export async function exportCorrectionsCSV(
  exam: Exam,
  classes: Class[],
  corrections: Correction[],
  students: Student[],
): Promise<string | null> {
  if (corrections.length === 0) return null;

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const header = ['Turma', 'Aluno', 'Nota', 'Acertos', 'Erros', 'Data'].join(',');

  const sorted = [...corrections].sort((a, b) => {
    const sa = a.studentId ? studentMap.get(a.studentId) : null;
    const sb = b.studentId ? studentMap.get(b.studentId) : null;
    const ca = sa ? classMap.get(sa.classId)?.name ?? 'zzz' : 'zzz';
    const cb = sb ? classMap.get(sb.classId)?.name ?? 'zzz' : 'zzz';
    if (ca !== cb) return ca.localeCompare(cb, 'pt-BR');
    const na = sa?.name ?? a.studentNameRaw ?? '';
    const nb = sb?.name ?? b.studentNameRaw ?? '';
    return na.localeCompare(nb, 'pt-BR');
  });

  const rows = sorted
    .map((c) => {
      const student = c.studentId ? studentMap.get(c.studentId) : null;
      const className =
        student && classMap.get(student.classId)?.name
          ? classMap.get(student.classId)!.name
          : '—';
      const studentName = student?.name ?? c.studentNameRaw ?? 'Não identificado';
      return [
        escapeCell(className),
        escapeCell(studentName),
        c.score.toFixed(1).replace('.', ','),
        String(c.hits),
        String(c.misses),
        new Date(c.correctedAt).toLocaleDateString('pt-BR'),
      ].join(',');
    })
    .join('\n');

  const csv = `${header}\n${rows}\n`;
  const examPart = safeName(exam.name);
  const classPart =
    classes.length === 1 ? safeName(classes[0].name) : 'turmas';
  const fileName = `${classPart}-${examPart}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar notas',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
}
