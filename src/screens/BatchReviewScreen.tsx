import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Crypto from "expo-crypto";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScoreBadge } from "../components/ScoreBadge";
import { Button } from "../components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogScrollArea,
  DialogTitle,
} from "../components/ui/Dialog";
import { IconButton } from "../components/ui/IconButton";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { RootStackParamList } from "../navigation/AppNavigator";
import { detectBatch } from "../services/geminiVision";
import {
  classStorage,
  correctionStorage,
  examStorage,
  findStudentByName,
  studentStorage,
} from "../services/storage";
import { Class, Correction, Exam, Student } from "../types";
import { colors, elevation, radius, spacing } from "../theme";
import { calculateGrade } from "../utils/grading";

type Props = NativeStackScreenProps<RootStackParamList, "BatchReview">;

interface BatchEntry {
  id: string;
  photoUri: string;
  studentId: string | null;
  studentNameRaw: string | null;
  confidence: "high" | "medium" | "low" | "none";
  detectedAnswers: Record<string, string>;
  error: string | null;
}

export function BatchReviewScreen({ route, navigation }: Props) {
  const { examId, classId, photoUris } = route.params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [progress, setProgress] = useState({
    done: 0,
    total: photoUris.length,
  });
  const [loading, setLoading] = useState(true);
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const e = await examStorage.get(examId);
      if (!e) {
        navigation.goBack();
        return;
      }
      const c = await classStorage.get(classId);
      const sts = await studentStorage.listByClass(classId);
      if (cancelled) return;
      setExam(e);
      setCls(c ?? null);
      setStudents(sts);

      const results = await detectBatch(e, photoUris, (done, total) => {
        if (!cancelled) setProgress({ done, total });
      });

      if (cancelled) return;

      const entries: BatchEntry[] = results.map((r) => {
        if (r.error || !r.result) {
          return {
            id: Crypto.randomUUID(),
            photoUri: r.photoUri,
            studentId: null,
            studentNameRaw: null,
            confidence: "none",
            detectedAnswers: Object.fromEntries(
              e.questions.map((q) => [q.id, "?"]),
            ),
            error: r.error,
          };
        }
        const matched =
          r.result.studentName && r.result.studentNameConfidence !== "none"
            ? findStudentByName(r.result.studentName, sts)
            : null;
        return {
          id: Crypto.randomUUID(),
          photoUri: r.photoUri,
          studentId: matched?.id ?? null,
          studentNameRaw: r.result.studentName,
          confidence: r.result.studentNameConfidence,
          detectedAnswers: r.result.answers,
          error: null,
        };
      });

      setEntries(entries);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, photoUris, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!classId) return;
      let cancelled = false;
      (async () => {
        const sts = await studentStorage.listByClass(classId);
        if (cancelled) return;
        setStudents(sts);
      })();
      return () => {
        cancelled = true;
      };
    }, [classId]),
  );

  const summary = useMemo(() => {
    const identified = entries.filter((e) => e.studentId).length;
    const failed = entries.filter((e) => e.error).length;
    return { identified, total: entries.length, failed };
  }, [entries]);

  const updateEntry = (id: string, patch: Partial<BatchEntry>) =>
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const pickStudent = (entryId: string) => setPickingFor(entryId);

  const confirmStudent = (studentId: string) => {
    if (!pickingFor) return;
    updateEntry(pickingFor, { studentId });
    setPickingFor(null);
  };

  const handleAddStudent = async () => {
    const name = newStudentName.trim();
    if (!name || !classId) return;
    const student: Student = {
      id: Crypto.randomUUID(),
      classId,
      name,
      createdAt: new Date().toISOString(),
    };
    await studentStorage.save(student);
    setStudents((prev) =>
      [...prev, student].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setNewStudentName("");
    setShowAddStudent(false);
  };

  const editAnswers = (entryId: string) => {
    if (!exam) return;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const studentName = entry.studentId
      ? students.find((s) => s.id === entry.studentId)?.name || "Aluno"
      : entry.studentNameRaw || "Aluno não identificado";
    navigation.navigate("Result", {
      examId,
      studentName,
      photoUris: [entry.photoUri],
      detectedAnswers: entry.detectedAnswers,
    });
  };

  const handleSaveAll = async () => {
    if (!exam) return;
    const unidentified = entries.filter((e) => !e.studentId);
    if (unidentified.length > 0) {
      Alert.alert(
        "Algumas avaliações sem aluno",
        `${unidentified.length} avaliaç${unidentified.length === 1 ? 'ão ainda está' : 'ões ainda estão'} sem aluno selecionado. Deseja salvar mesmo assim?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salvar tudo", onPress: () => doSave() },
        ],
      );
      return;
    }
    doSave();
  };

  const doSave = async () => {
    if (!exam) return;
    setSaving(true);
    try {
      const corrections: Correction[] = entries.map((entry) => {
        const grade = calculateGrade(exam, entry.detectedAnswers);
        return {
          id: Crypto.randomUUID(),
          examId,
          studentId: entry.studentId,
          studentNameRaw: entry.studentNameRaw,
          photoUris: [entry.photoUri],
          detectedAnswers: entry.detectedAnswers,
          score: grade.score,
          hits: grade.hits,
          misses: grade.misses,
          correctedAt: new Date().toISOString(),
          identified: !!entry.studentId,
        };
      });
      await correctionStorage.saveMany(corrections);
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: "MainTabs" },
            { name: "ExamDetail", params: { examId } },
          ],
        }),
      );
    } catch (err) {
      Alert.alert("Erro", `Não foi possível salvar: ${err}`);
      setSaving(false);
    }
  };

  if (loading || !exam) {
    return (
      <View style={styles.loadingScreen}>
        <Spinner size="large" color={colors.primary} />
        <Text style={styles.loadingTitle}>Analisando avaliações com IA</Text>
        <Text style={styles.loadingHint}>
          {progress.done} de {progress.total} processadas...
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(progress.done / progress.total) * 100}%` },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
      >
        <View style={[styles.summaryCard, elevation.sm]}>
          <Text style={styles.summaryTitle}>
            {summary.total} avaliaç{summary.total === 1 ? 'ão processada' : 'ões processadas'}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <View
                style={[styles.summaryDot, { backgroundColor: colors.accent }]}
              />
              <Text style={styles.summaryText}>
                {summary.identified} identificada(s)
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <View
                style={[styles.summaryDot, { backgroundColor: colors.warning }]}
              />
              <Text style={styles.summaryText}>
                {summary.total - summary.identified - summary.failed} para
                revisar
              </Text>
            </View>
            {summary.failed > 0 ? (
              <View style={styles.summaryStat}>
                <View
                  style={[
                    styles.summaryDot,
                    { backgroundColor: colors.danger },
                  ]}
                />
                <Text style={styles.summaryText}>
                  {summary.failed} com erro
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {entries.map((entry) => {
          const grade = calculateGrade(exam, entry.detectedAnswers);
          const matchedStudent = students.find((s) => s.id === entry.studentId);
          const needsReview = !entry.studentId;

          return (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                elevation.sm,
                needsReview && styles.entryCardWarning,
              ]}
            >
              <View style={styles.entryRow}>
                <Image
                  source={{ uri: entry.photoUri }}
                  style={styles.entryPhoto}
                />

                <View style={{ flex: 1, gap: 4 }}>
                  {entry.error ? (
                    <View style={styles.errorChip}>
                      <Text style={styles.errorChipText}>
                        ⚠ Erro: {entry.error}
                      </Text>
                    </View>
                  ) : null}

                  {matchedStudent ? (
                    <>
                      <Text style={styles.entryName}>
                        {matchedStudent.name}
                      </Text>
                      {entry.confidence !== "high" && entry.studentNameRaw ? (
                        <Text style={styles.entryHint}>
                          IA leu: "{entry.studentNameRaw}" ({entry.confidence})
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Text style={styles.entryUnidentified}>
                        ⚠ Aluno não identificado
                      </Text>
                      {entry.studentNameRaw ? (
                        <Text style={styles.entryHint}>
                          IA leu: "{entry.studentNameRaw}" — sem match na turma
                        </Text>
                      ) : (
                        <Text style={styles.entryHint}>
                          A IA não conseguiu ler o nome
                        </Text>
                      )}
                    </>
                  )}
                </View>

                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <ScoreBadge score={grade.score} size="sm" />
                  <IconButton
                    icon="close"
                    size={16}
                    color={colors.textMuted}
                    accessibilityLabel="Remover correção"
                    onPress={() => removeEntry(entry.id)}
                  />
                </View>
              </View>

              <View style={styles.entryFooter}>
                <Button
                  variant={matchedStudent ? "ghost" : "tonal"}
                  size="sm"
                  style={{ flex: 1 }}
                  iconLeft={
                    <Ionicons
                      name={
                        matchedStudent
                          ? "swap-horizontal"
                          : "person-add-outline"
                      }
                      size={16}
                      color={
                        matchedStudent ? colors.primary : colors.primaryDark
                      }
                    />
                  }
                  onPress={() => pickStudent(entry.id)}
                >
                  {matchedStudent ? "Trocar aluno" : "Selecionar aluno"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ flex: 1 }}
                  iconLeft={
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={colors.primary}
                    />
                  }
                  onPress={() => editAnswers(entry.id)}
                >
                  Editar respostas
                </Button>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={{ flex: 1 }}
          className="border-line"
          labelClasses="text-ink-muted"
        >
          Voltar
        </Button>
        <View style={{ width: spacing.sm }} />
        <Button
          iconLeft={
            <Ionicons name="checkmark-done" size={18} color="#ffffff" />
          }
          style={{ flex: 2 }}
          onPress={handleSaveAll}
          loading={saving}
          disabled={saving || entries.length === 0}
        >
          Salvar {entries.length} correção(ões)
        </Button>
      </View>

      <Dialog
        open={!!pickingFor}
        onOpenChange={(o) => !o && setPickingFor(null)}
      >
        <DialogTitle>
          {cls ? `Selecionar aluno • ${cls.name}` : "Selecionar aluno"}
        </DialogTitle>
        <DialogScrollArea>
          {students.length === 0 ? (
            <View className="px-5 py-6">
              <Text className="text-ink-muted text-center">
                Nenhum aluno cadastrado nesta turma. Volte e adicione alunos
                primeiro.
              </Text>
            </View>
          ) : (
            students.map((s) => {
              const usedBy = entries.find(
                (e) => e.studentId === s.id && e.id !== pickingFor,
              );
              return (
                <Pressable
                  key={s.id}
                  onPress={() => confirmStudent(s.id)}
                  className="flex-row items-center py-3 px-5 gap-3 active:bg-brand-50"
                >
                  <View className="w-9 h-9 rounded-full bg-brand-50 items-center justify-center">
                    <Text className="text-brand-700 font-bold">
                      {s.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className="flex-1 text-[15px] text-ink font-medium"
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                  {usedBy ? (
                    <Text className="text-[10px] text-ink-muted bg-bg-muted px-1.5 py-0.5 rounded">
                      já em uso
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
          <Pressable
            onPress={() => {
              setPickingFor(null);
              setShowAddStudent(true);
            }}
            className="flex-row items-center py-3 px-5 gap-3 active:bg-brand-50 border-t border-line"
          >
            <View className="w-9 h-9 rounded-full bg-brand-50 items-center justify-center">
              <Text className="text-brand-700 font-bold text-[18px]">＋</Text>
            </View>
            <Text className="flex-1 text-[15px] font-semibold text-brand-500">
              Adicionar aluno
            </Text>
          </Pressable>
        </DialogScrollArea>
        <DialogActions>
          <Button variant="ghost" onPress={() => setPickingFor(null)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAddStudent}
        onOpenChange={(o) => !o && setShowAddStudent(false)}
      >
        <DialogTitle>Novo aluno</DialogTitle>
        <DialogContent>
          <Input
            label="Nome do aluno"
            value={newStudentName}
            onChangeText={setNewStudentName}
            placeholder="Ex.: João Silva"
            autoFocus
            autoCapitalize="words"
          />
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onPress={() => setShowAddStudent(false)}>
            Cancelar
          </Button>
          <Button onPress={handleAddStudent} disabled={!newStudentName.trim()}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  loadingHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  progressBar: {
    width: "80%",
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: spacing.lg,
  },
  progressFill: { height: "100%", backgroundColor: colors.primary },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  summaryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  summaryStat: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  summaryDot: { width: 8, height: 8, borderRadius: 999 },
  summaryText: { fontSize: 13, color: colors.textSecondary },

  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  entryCardWarning: {
    borderColor: colors.warning,
    backgroundColor: "#fffbeb",
  },
  entryRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  entryPhoto: {
    width: 64,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  entryName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  entryUnidentified: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
  },
  entryHint: { fontSize: 12, color: colors.textMuted },
  errorChip: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  errorChipText: { color: colors.danger, fontSize: 11, fontWeight: "600" },

  entryFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },

  bottomBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
  },

  studentPickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatarText: { color: colors.primaryDark, fontWeight: "700" },
  studentPickName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  usedTag: {
    fontSize: 10,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
