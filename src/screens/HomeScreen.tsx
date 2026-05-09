import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeStackParamList } from "../navigation/AppNavigator";
import { correctionStorage, examStorage } from "../services/storage";
import { Exam } from "../types";
import {
  buildTurmaDashboardRows,
  countCorrectionsByExam,
  TurmaDashboardRow,
} from "../utils/homeDashboard";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

interface ExamWithCount extends Exam {
  correctionCount: number;
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [exams, setExams] = useState<ExamWithCount[]>([]);
  const [turmaRows, setTurmaRows] = useState<TurmaDashboardRow[]>([]);
  const [totalCorrections, setTotalCorrections] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [allExams, allCorrections] = await Promise.all([
      examStorage.list(),
      correctionStorage.listAll(),
    ]);
    const byExam = countCorrectionsByExam(allCorrections);
    const withCounts: ExamWithCount[] = allExams.map((e) => ({
      ...e,
      correctionCount: byExam.get(e.id) ?? 0,
    }));
    setExams(withCounts);
    setTurmaRows(buildTurmaDashboardRows(allExams, allCorrections));
    setTotalCorrections(allCorrections.length);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const overallAvgScore = useMemo(() => {
    if (totalCorrections === 0) return null;
    let s = 0;
    let n = 0;
    for (const row of turmaRows) {
      if (row.correctionCount > 0 && row.avgScore != null) {
        s += row.avgScore * row.correctionCount;
        n += row.correctionCount;
      }
    }
    return n > 0 ? s / n : null;
  }, [turmaRows, totalCorrections]);

  const distinctTurmas = turmaRows.length;

  const renderDashboard = () => (
    <View style={styles.dashboard}>
      <Text
        variant="titleLarge"
        style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
      >
        Painel
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.sectionHint, { color: theme.colors.onSurfaceVariant }]}
      >
        Visão geral das turmas e da atividade de correção.
      </Text>

      <View style={styles.statRow}>
        <View
          style={[
            styles.statTile,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Icon
            source="file-document-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            variant="headlineSmall"
            style={[styles.statValue, { color: theme.colors.onSurface }]}
          >
            {exams.length}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Avaliações
          </Text>
        </View>
        <View
          style={[
            styles.statTile,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Icon
            source="account-check-outline"
            size={20}
            color={theme.colors.secondary}
          />
          <Text
            variant="headlineSmall"
            style={[styles.statValue, { color: theme.colors.onSurface }]}
          >
            {totalCorrections}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Correções
          </Text>
        </View>
        <View
          style={[
            styles.statTile,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Icon
            source="account-group-outline"
            size={20}
            color={theme.colors.tertiary ?? theme.colors.primary}
          />
          <Text
            variant="headlineSmall"
            style={[styles.statValue, { color: theme.colors.onSurface }]}
          >
            {distinctTurmas}
          </Text>
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Turmas
          </Text>
        </View>
      </View>

      {overallAvgScore != null && (
        <View
          style={[
            styles.avgBanner,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onPrimaryContainer,
              fontWeight: "600",
            }}
          >
            Média geral: {overallAvgScore.toFixed(1).replace(".", ",")}
          </Text>
          <Text
            style={{
              color: theme.colors.onPrimaryContainer,
              opacity: 0.85,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            entre {totalCorrections} correção(ões)
          </Text>
        </View>
      )}

      <Text
        variant="titleMedium"
        style={[styles.subsectionTitle, { color: theme.colors.onSurface }]}
      >
        Por turma
      </Text>

      {turmaRows.length === 0 ? (
        <Text
          style={[styles.emptyTurmas, { color: theme.colors.onSurfaceVariant }]}
        >
          Nenhuma turma com dados ainda. Cadastre turmas e crie avaliações na
          aba Avaliações.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.turmaScroll}
        >
          {turmaRows.map((row) => (
            <Card
              key={row.key}
              mode="outlined"
              style={[
                styles.turmaCard,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              <Card.Content style={styles.turmaCardInner}>
                <Text
                  variant="titleSmall"
                  numberOfLines={1}
                  style={{ color: theme.colors.onSurface }}
                >
                  {row.label}
                </Text>
                <Text
                  style={[
                    styles.turmaMeta,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {row.examCount}{" "}
                  {row.examCount === 1 ? "avaliação" : "avaliações"} ·{" "}
                  {row.correctionCount}{" "}
                  {row.correctionCount === 1 ? "correção" : "correções"}
                </Text>
                <View style={styles.turmaAvgRow}>
                  <Text
                    variant="headlineSmall"
                    style={{
                      color:
                        row.avgScore == null
                          ? theme.colors.onSurfaceVariant
                          : row.avgScore >= 7
                            ? "#4ade80"
                            : row.avgScore >= 5
                              ? "#fbbf24"
                              : "#f87171",
                    }}
                  >
                    {row.avgScore != null
                      ? row.avgScore.toFixed(1).replace(".", ",")
                      : "—"}
                  </Text>
                  <Text
                    style={[
                      styles.turmaAvgLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    média
                  </Text>
                </View>
                {row.lastCorrectionAt ? (
                  <Text
                    style={[styles.turmaLast, { color: theme.colors.outline }]}
                  >
                    Última: {formatShortDate(row.lastCorrectionAt)}
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}

      {!loading && exams.length > 0 ? (
        <Text
          variant="titleMedium"
          style={[
            styles.avaliaçõesSectionTitle,
            { color: theme.colors.onSurface },
          ]}
        >
          Suas Avaliações
        </Text>
      ) : null}
    </View>
  );

  const listEmpty = loading ? (
    <View style={styles.listEmptyLoading} />
  ) : exams.length === 0 ? (
    <View style={styles.empty}>
      <Icon
        source="clipboard-text-outline"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text
        variant="headlineSmall"
        style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
      >
        Nenhuma avaliação ainda
      </Text>
      <Text
        style={[styles.emptyBody, { color: theme.colors.onSurfaceVariant }]}
      >
        Use a aba{" "}
        <Text style={{ fontWeight: "700", color: theme.colors.primary }}>
          Avaliações
        </Text>{" "}
        para cadastrar o gabarito. Depois, abra a avaliação e toque em{" "}
        <Text style={{ fontWeight: "700", color: theme.colors.primary }}>
          Corrigir aluno
        </Text>{" "}
        para fotografar as respostas.
      </Text>
    </View>
  ) : null;

  const listHeader = loading ? (
    <View style={styles.loadingHeader}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text
        style={[styles.loadingHint, { color: theme.colors.onSurfaceVariant }]}
      >
        Carregando…
      </Text>
    </View>
  ) : (
    renderDashboard()
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom + 24, 24),
          },
        ]}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={styles.listHeader}
        ListEmptyComponent={listEmpty}
        renderItem={({ item }) => {
          const created = new Date(item.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          return (
            <Card
              style={styles.card}
              mode="elevated"
              onPress={() =>
                navigation.navigate("ExamDetail", { examId: item.id })
              }
            >
              <Card.Title
                title={item.name}
                titleStyle={[
                  styles.cardTitle,
                  { color: theme.colors.onSurface },
                ]}
                subtitle={`Turma ${item.className} · ${item.questions.length} questões · ${created}`}
                subtitleStyle={[
                  styles.cardSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                right={() => (
                  <Icon
                    source="chevron-right"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                )}
              />
              <Card.Content style={styles.cardFooter}>
                <Text
                  style={[
                    styles.cardMeta,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {item.correctionCount === 0
                    ? "Nenhum aluno corrigido"
                    : `${item.correctionCount} aluno(s) corrigido(s)`}
                </Text>
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 24 },
  listHeader: { marginBottom: 4 },
  dashboard: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontWeight: "700" },
  sectionHint: { marginTop: 4, marginBottom: 14, lineHeight: 20 },
  statRow: { flexDirection: "row", gap: 10 },
  statTile: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
    minHeight: 92,
    justifyContent: "flex-start",
  },
  statValue: { marginTop: 8, fontWeight: "700" },
  avgBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  subsectionTitle: { marginTop: 20, marginBottom: 10, fontWeight: "600" },
  emptyTurmas: { marginBottom: 8, lineHeight: 20 },
  avaliaçõesSectionTitle: { marginTop: 8, marginBottom: 6, fontWeight: "600" },
  loadingHeader: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingHint: { marginTop: 12, fontSize: 14 },
  listEmptyLoading: { minHeight: 24 },
  turmaScroll: { paddingBottom: 8, gap: 10 },
  turmaCard: { width: 172, borderRadius: 4, marginRight: 10 },
  turmaCardInner: { paddingVertical: 8 },
  turmaMeta: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  turmaAvgRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 10,
  },
  turmaAvgLabel: { fontSize: 12 },
  turmaLast: { fontSize: 11, marginTop: 8 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: { marginTop: 16, marginBottom: 12, textAlign: "center" },
  emptyBody: { textAlign: "center", lineHeight: 22, maxWidth: 320 },
  card: { marginBottom: 12, marginHorizontal: 16 },
  cardTitle: { fontWeight: "700" },
  cardSubtitle: { marginTop: 2 },
  cardFooter: { paddingTop: 0 },
  cardMeta: { fontSize: 14 },
});
