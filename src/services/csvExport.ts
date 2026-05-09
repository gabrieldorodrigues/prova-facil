import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Correction, Exam } from '../types';

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
  corrections: Correction[],
): Promise<string | null> {
  if (corrections.length === 0) return null;

  const header = ['Aluno', 'Turma', 'Nota', 'Acertos', 'Erros', 'Data'].join(',');
  const rows = corrections
    .map((c) =>
      [
        escapeCell(c.studentName),
        escapeCell(c.className ?? exam.className),
        c.score.toFixed(1).replace('.', ','),
        String(c.hits),
        String(c.misses),
        new Date(c.correctedAt).toLocaleDateString('pt-BR'),
      ].join(','),
    )
    .join('\n');

  const csv = `${header}\n${rows}\n`;
  const fileName = `${safeName(exam.className)}-${safeName(exam.name)}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Exportar notas da turma',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return fileUri;
}
