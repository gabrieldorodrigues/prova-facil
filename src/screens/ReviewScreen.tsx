import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnswerCell } from "../components/AnswerCell";
import { HomeStackParamList } from "../navigation/AppNavigator";
import { detectAnswers, GeminiKeyMissingError } from "../services/geminiVision";
import { examStorage } from "../services/storage";
import { Exam, QUESTION_TYPE_LABEL } from "../types";
import { getOptionsForType } from "../utils/grading";

type Props = NativeStackScreenProps<HomeStackParamList, "Review">;

export function ReviewScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { examId, studentName, photoUris, className } = route.params;
  const insets = useSafeAreaInsets();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const e = await examStorage.get(examId);
      if (!e) {
        navigation.goBack();
        return;
      }
      if (!cancelled) setExam(e);

      try {
        const detected = await detectAnswers(e, photoUris);
        if (!cancelled) setAnswers(detected);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof GeminiKeyMissingError) {
          setError(
            "Chave de API do Gemini não configurada. Crie um .env na raiz do projeto com EXPO_PUBLIC_GEMINI_API_KEY=... (obtenha em https://aistudio.google.com/apikey) e reinicie o expo. Você pode preencher as respostas manualmente abaixo.",
          );
        } else {
          setError(
            `Falha ao chamar Gemini: ${String(err)}. Preencha manualmente.`,
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

  if (loading || !exam) {
    return (
      <View
        style={[styles.loading, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}
        >
          Analisando fotos com Gemini...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom + 100, 100),
        }}
      >
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          Aluno: <Text style={{ fontWeight: "700" }}>{studentName}</Text>
        </Text>
        <Text
          style={[
            styles.subtitle,
            { marginBottom: 8, color: theme.colors.onSurface },
          ]}
        >
          Turma: <Text style={{ fontWeight: "700" }}>{className}</Text>
        </Text>
        <Text
          style={[
            styles.subtitle,
            { marginBottom: 12, color: theme.colors.onSurfaceVariant },
          ]}
        >
          Toque em uma alternativa para alternar a resposta detectada.
        </Text>

        {error && (
          <Card
            style={[
              styles.errorCard,
              {
                backgroundColor: theme.colors.errorContainer,
                borderColor: theme.colors.error,
              },
            ]}
          >
            <Card.Content>
              <Text style={{ color: theme.colors.onErrorContainer }}>
                {error}
              </Text>
            </Card.Content>
          </Card>
        )}

        {exam.questions.map((q) => {
          const options = getOptionsForType(q.type);
          const detected = answers[q.id] || "?";
          return (
            <Card
              key={q.id}
              style={[styles.qCard, { backgroundColor: theme.colors.surface }]}
              mode="elevated"
            >
              <View style={styles.qHeader}>
                <Text
                  style={[styles.qNumber, { color: theme.colors.onSurface }]}
                >
                  Questão {q.number}
                </Text>
                <Text
                  style={[
                    styles.qType,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {QUESTION_TYPE_LABEL[q.type]}
                </Text>
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
            </Card>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: 16 + insets.bottom }]}>
        <Button
          mode="contained"
          contentStyle={{ paddingVertical: 6 }}
          onPress={() =>
            navigation.navigate("Result", {
              examId,
              studentName,
              photoUris,
              detectedAnswers: answers,
              className,
            })
          }
        >
          Calcular nota
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: { marginTop: 16 },
  subtitle: { marginBottom: 4 },
  qCard: { marginBottom: 10, padding: 12 },
  qHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  qNumber: { fontWeight: "600" },
  qType: { fontSize: 12 },
  cells: { flexDirection: "row", flexWrap: "wrap" },
  errorCard: { marginBottom: 12, borderWidth: 1 },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
  },
});
