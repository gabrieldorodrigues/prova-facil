import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Crypto from "expo-crypto";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnswerCell } from "../components/AnswerCell";
import { Button } from "../components/ui/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogScrollArea,
  DialogTitle,
} from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { RootStackParamList } from "../navigation/AppNavigator";
import { detectAnswers, GeminiKeyMissingError } from "../services/geminiVision";
import { classStorage, examStorage, studentStorage } from "../services/storage";
import { Class, Exam, QUESTION_TYPE_LABEL, Student } from "../types";
import { colors, elevation, radius, spacing } from "../theme";
import { getOptionsForType } from "../utils/grading";

type Props = NativeStackScreenProps<RootStackParamList, "Review">;

export function ReviewScreen({ route, navigation }: Props) {
  const {
    examId,
    studentName: initialStudentName,
    photoUris,
    studentId: initialStudentId,
  } = route.params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(
    initialStudentId ?? null,
  );
  const [studentName, setStudentName] = useState(initialStudentName);
  const [students, setStudents] = useState<Student[]>([]);
  const [showChangeStudent, setShowChangeStudent] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [newStudentClassId, setNewStudentClassId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const e = await examStorage.get(examId);
      if (!e) {
        navigation.goBack();
        return;
      }
      if (!cancelled) setExam(e);

      const cls: Class[] = [];
      for (const cid of e.classIds) {
        const c = await classStorage.get(cid);
        if (c) cls.push(c);
      }
      const allStudents: Student[] = [];
      for (const classId of e.classIds) {
        const sts = await studentStorage.listByClass(classId);
        allStudents.push(...sts);
      }
      if (!cancelled) {
        setClasses(cls);
        setStudents(allStudents);
        if (cls.length === 1) setNewStudentClassId(cls[0].id);
      }

      try {
        const detected = await detectAnswers(e, photoUris);
        if (!cancelled) setAnswers(detected);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof GeminiKeyMissingError) {
          setError(
            "Chave da API do Gemini não configurada. Crie um .env com EXPO_PUBLIC_GEMINI_API_KEY=... (obtenha em aistudio.google.com/apikey). Você pode preencher manualmente abaixo.",
          );
        } else {
          setError(
            `Falha ao chamar a IA: ${String(err)}. Preencha manualmente abaixo.`,
          );
        }
        const fallback: Record<string, string> = {};
        for (const q of e.questions) fallback[q.id] = "?";
        setAnswers(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, photoUris, navigation]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const e = await examStorage.get(examId);
        if (!e || cancelled) return;
        const cls: Class[] = [];
        for (const cid of e.classIds) {
          const c = await classStorage.get(cid);
          if (c) cls.push(c);
        }
        const allStudents: Student[] = [];
        for (const classId of e.classIds) {
          const sts = await studentStorage.listByClass(classId);
          allStudents.push(...sts);
        }
        if (cancelled) return;
        allStudents.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        setClasses(cls);
        setStudents(allStudents);
        if (cls.length === 1) setNewStudentClassId(cls[0].id);
      })();
      return () => {
        cancelled = true;
      };
    }, [examId]),
  );

  const stats = useMemo(() => {
    if (!exam) return { detected: 0, total: 0 };
    const total = exam.questions.length;
    const detected = exam.questions.filter((q) => {
      const a = answers[q.id];
      return a && a !== "?";
    }).length;
    return { detected, total };
  }, [exam, answers]);

  const studentsByClass = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const arr = map.get(s.classId) ?? [];
      arr.push(s);
      map.set(s.classId, arr);
    }
    return map;
  }, [students]);

  const handleAddStudent = async () => {
    const name = newStudentName.trim();
    const targetClassId = newStudentClassId ?? classes[0]?.id;
    if (!name || !targetClassId) return;
    const newStudent: Student = {
      id: Crypto.randomUUID(),
      classId: targetClassId,
      name,
      createdAt: new Date().toISOString(),
    };
    await studentStorage.save(newStudent);
    setStudents((prev) =>
      [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setStudentId(newStudent.id);
    setStudentName(newStudent.name);
    setNewStudentName("");
    setShowAddStudent(false);
    setShowChangeStudent(false);
    if (classes.length === 1) setNewStudentClassId(classes[0].id);
    else setNewStudentClassId(null);
  };

  const confirmStudent = (sid: string) => {
    const s = students.find((st) => st.id === sid);
    if (s) {
      setStudentId(sid);
      setStudentName(s.name);
      setShowChangeStudent(false);
    }
  };

  if (loading || !exam) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Analisando com IA</Text>
          <Text style={styles.loadingHint}>
            Lendo as marcações nas {photoUris.length} foto(s)...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
      >
        <Pressable
          onPress={() => setShowChangeStudent(true)}
          style={({ pressed }) => [
            styles.headerCard,
            elevation.sm,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentLabel}>Corrigindo prova de</Text>
              <Text style={styles.studentName}>{studentName}</Text>
            </View>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(stats.detected / stats.total) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats.detected}/{stats.total}
            </Text>
          </View>
          <Text style={styles.headerHint}>
            Toque em uma alternativa para alterar a resposta detectada.
          </Text>
        </Pressable>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {exam.questions.map((q) => {
          const options = getOptionsForType(q.type);
          const detected = answers[q.id] || "?";
          const isUnknown = detected === "?";
          return (
            <View key={q.id} style={[styles.qCard, elevation.sm]}>
              <View style={styles.qHeader}>
                <View style={styles.qNumberBadge}>
                  <Text style={styles.qNumberText}>{q.number}</Text>
                </View>
                <Text style={styles.qType}>{QUESTION_TYPE_LABEL[q.type]}</Text>
                <View style={{ flex: 1 }} />
                {isUnknown ? (
                  <View style={styles.unknownChip}>
                    <Text style={styles.unknownChipText}>verificar</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cells}>
                {options.map((opt) => (
                  <AnswerCell
                    key={opt}
                    label={opt}
                    variant={detected === opt ? "selected" : "default"}
                    onPress={() =>
                      setAnswers((p) => ({
                        ...p,
                        [q.id]: detected === opt ? "?" : opt,
                      }))
                    }
                  />
                ))}
                <AnswerCell
                  label="?"
                  variant={detected === "?" ? "unknown" : "default"}
                  onPress={() => setAnswers((p) => ({ ...p, [q.id]: "?" }))}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          size="lg"
          iconLeft={
            <Ionicons name="calculator-outline" size={20} color="#ffffff" />
          }
          onPress={() =>
            navigation.navigate("Result", {
              examId,
              studentId: studentId ?? undefined,
              studentName,
              photoUris,
              detectedAnswers: answers,
            })
          }
        >
          Calcular nota
        </Button>
      </View>

      <Dialog
        open={showChangeStudent}
        onOpenChange={(o) => !o && setShowChangeStudent(false)}
      >
        <DialogTitle>Selecionar aluno</DialogTitle>
        <DialogScrollArea>
          {students.length === 0 ? (
            <View className="px-5 py-6">
              <Text className="text-ink-muted text-center">
                Nenhum aluno cadastrado nas turmas desta prova. Use “Adicionar
                aluno” para cadastrar e escolher a turma.
              </Text>
            </View>
          ) : (
            classes.map((c) => {
              const list = studentsByClass.get(c.id) ?? [];
              if (list.length === 0) return null;
              return (
                <View key={c.id}>
                  <Text className="px-5 pt-3 pb-1 text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    {c.name}
                  </Text>
                  {list.map((s) => (
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
                      {studentId === s.id ? (
                        <Text className="text-brand-500 text-[20px] font-extrabold">
                          ✓
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              );
            })
          )}
          <Pressable
            onPress={() => {
              setShowChangeStudent(false);
              if (classes.length === 1) setNewStudentClassId(classes[0].id);
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
          <Button variant="ghost" onPress={() => setShowChangeStudent(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showAddStudent}
        onOpenChange={(o) => !o && setShowAddStudent(false)}
      >
        <DialogTitle>Novo aluno</DialogTitle>
        <DialogContent>
          {classes.length > 1 ? (
            <>
              <Text style={styles.fieldLabel}>Turma</Text>
              <Text style={styles.fieldHint}>
                Apenas turmas em que esta avaliação está disponível.
              </Text>
              <View style={styles.classChipsRow}>
                {classes.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setNewStudentClassId(c.id)}
                    style={({ pressed }) => [
                      styles.classChoiceChip,
                      newStudentClassId === c.id && {
                        backgroundColor: colors.primary,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.classChoiceText,
                        newStudentClassId === c.id && { color: "#ffffff" },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          <Input
            label="Nome do aluno"
            value={newStudentName}
            onChangeText={setNewStudentName}
            placeholder="Ex.: João Silva"
            autoFocus
            autoCapitalize="words"
            containerClasses={classes.length > 1 ? "mt-2" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onPress={() => setShowAddStudent(false)}>
            Cancelar
          </Button>
          <Button
            onPress={handleAddStudent}
            disabled={
              !newStudentName.trim() ||
              (classes.length > 1 && !newStudentClassId)
            }
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  loadingBox: { alignItems: "center" },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  loadingHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  studentLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  studentName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accent },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  headerHint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },

  errorCard: {
    flexDirection: "row",
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  errorIcon: { fontSize: 20 },
  errorText: { flex: 1, fontSize: 13, color: "#92400e", lineHeight: 18 },

  qCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  qNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  qNumberText: { color: colors.primaryDark, fontWeight: "700", fontSize: 13 },
  qType: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  unknownChip: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  unknownChipText: { color: "#92400e", fontSize: 10, fontWeight: "700" },
  cells: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },

  bottomBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },

  fieldLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  classChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  classChoiceChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  classChoiceText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
