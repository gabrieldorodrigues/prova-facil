import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TurmasStackParamList } from "../navigation/AppNavigator";
import { correctionStorage, examStorage } from "../services/storage";
import { turmasStorage } from "../services/turmasStorage";
import { Exam } from "../types";
import {
  averageOfAllCorrections,
  buildTurmaGradeDetail,
  ExamGradeRowForTurma,
} from "../utils/homeDashboard";

type Props = NativeStackScreenProps<TurmasStackParamList, "TurmasList">;

function formatNota(n: number | null): string {
  if (n == null) return "—";
  return n.toFixed(1).replace(".", ",");
}

function notaColor(score: number | null, mutedColor: string): string {
  if (score == null) return mutedColor;
  if (score >= 7) return "#4ade80";
  if (score >= 5) return "#fbbf24";
  return "#f87171";
}

export function TurmasScreen(_props: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [turmas, setTurmas] = useState<string[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [corrections, setCorrections] = useState<
    Awaited<ReturnType<typeof correctionStorage.listAll>>
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [expandedTurma, setExpandedTurma] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [list, allExams, allCorrections] = await Promise.all([
      turmasStorage.list(),
      examStorage.list(),
      correctionStorage.listAll(),
    ]);
    setTurmas(list);
    setExams(allExams);
    setCorrections(allCorrections);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const mediaGeralTotal = useMemo(
    () => averageOfAllCorrections(corrections),
    [corrections],
  );

  const detailCache = useMemo(() => {
    const m = new Map<string, ReturnType<typeof buildTurmaGradeDetail>>();
    for (const t of turmas) {
      m.set(t, buildTurmaGradeDetail(t, exams, corrections));
    }
    return m;
  }, [turmas, exams, corrections]);

  const handleAdd = async () => {
    const added = await turmasStorage.add(newName);
    if (!added) {
      Alert.alert("Atenção", "Informe um nome para a turma.");
      return;
    }
    setNewName("");
    setDialogOpen(false);
    await load();
  };

  const handleRemove = (name: string) => {
    Alert.alert(
      "Remover turma?",
      `A turma "${name}" sairá da lista (avaliações e correções não são apagadas).`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await turmasStorage.remove(name);
            if (expandedTurma === name) setExpandedTurma(null);
            await load();
          },
        },
      ],
    );
  };

  const toggleExpand = (name: string) => {
    setExpandedTurma((prev) => (prev === name ? null : name));
  };

  const renderExamRow = (row: ExamGradeRowForTurma) => (
    <View key={row.examId} style={styles.examRow}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text
          numberOfLines={2}
          style={{
            color: theme.colors.onSurface,
            fontWeight: "500",
            fontSize: 14,
          }}
        >
          {row.examName}
        </Text>
        <Text
          style={{
            color: theme.colors.onSurfaceVariant,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {row.correctionCount}{" "}
          {row.correctionCount === 1 ? "correção" : "correções"}
        </Text>
      </View>
      <Text
        style={{
          color: notaColor(row.avgScore, theme.colors.onSurfaceVariant),
          fontWeight: "700",
          fontSize: 16,
        }}
      >
        {formatNota(row.avgScore)}
      </Text>
    </View>
  );

  const listHeader = (
    <View style={styles.header}>
      <Text
        variant="titleMedium"
        style={[styles.headerTitle, { color: theme.colors.onSurface }]}
      >
        Suas turmas
      </Text>
      <Text
        style={[styles.headerHint, { color: theme.colors.onSurfaceVariant }]}
      >
        Médias usam as correções já salvas (turma registrada na correção ou na
        avaliação).
      </Text>

      <Card
        mode="outlined"
        style={[
          styles.summaryCard,
          { borderColor: theme.colors.outlineVariant },
        ]}
      >
        <Card.Content style={styles.summaryInner}>
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Média geral (todas as correções)
          </Text>
          <Text
            variant="headlineLarge"
            style={{
              color: notaColor(mediaGeralTotal, theme.colors.onSurfaceVariant),
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            {formatNota(mediaGeralTotal)}
          </Text>
          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: 6,
              fontSize: 13,
            }}
          >
            {corrections.length === 0
              ? "Nenhuma correção salva ainda."
              : `${corrections.length} correção(ões) no total`}
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained-tonal"
        icon="plus"
        onPress={() => setDialogOpen(true)}
        style={styles.addBtn}
      >
        Adicionar turma
      </Button>
    </View>
  );

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.background }]}>
      {turmas.length === 0 ? (
        <>
          {listHeader}
          <Card style={{ marginHorizontal: 16, marginTop: 8 }} mode="elevated">
            <Card.Content style={styles.emptyInner}>
              <Text
                style={[styles.emptyText, { color: theme.colors.onSurface }]}
              >
                Nenhuma turma cadastrada ainda.
              </Text>
              <Text
                style={[
                  styles.emptySub,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Toque em &quot;Adicionar turma&quot; ou cadastre ao criar uma
                avaliação.
              </Text>
            </Card.Content>
          </Card>
        </>
      ) : (
        <FlatList
          data={turmas}
          keyExtractor={(item) => item}
          ListHeaderComponent={listHeader}
          contentContainerStyle={[
            styles.list,
            {
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom + 32, 32),
            },
          ]}
          renderItem={({ item }) => {
            const detail = detailCache.get(item)!;
            const open = expandedTurma === item;
            return (
              <Card style={styles.rowCard} mode="elevated">
                <Pressable
                  onPress={() => toggleExpand(item)}
                  android_ripple={{ color: theme.colors.surfaceVariant }}
                >
                  <View style={styles.turmaHeaderRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text
                        style={[
                          styles.rowTitle,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        {item}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        Média da turma:{" "}
                        <Text
                          style={{
                            color: notaColor(
                              detail.overallAvg,
                              theme.colors.onSurfaceVariant,
                            ),
                            fontWeight: "700",
                          }}
                        >
                          {formatNota(detail.overallAvg)}
                        </Text>
                        {detail.correctionCount > 0
                          ? ` · ${detail.correctionCount} correção(ões)`
                          : " · sem correções"}
                      </Text>
                    </View>
                    <IconButton
                      icon={open ? "chevron-up" : "chevron-down"}
                      size={22}
                      onPress={() => toggleExpand(item)}
                    />
                    <IconButton
                      icon="delete-outline"
                      iconColor={theme.colors.error}
                      onPress={() => handleRemove(item)}
                    />
                  </View>
                </Pressable>

                {open && (
                  <View style={styles.expandSection}>
                    <Divider />
                    <Text
                      variant="labelLarge"
                      style={{
                        color: theme.colors.onSurface,
                        marginTop: 12,
                        marginBottom: 8,
                        marginHorizontal: 16,
                      }}
                    >
                      Média por Avaliação
                    </Text>
                    {detail.byExam.length === 0 ? (
                      <Text
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          marginHorizontal: 16,
                          marginBottom: 12,
                          fontSize: 13,
                        }}
                      >
                        Nenhuma correção associada a esta turma ainda.
                      </Text>
                    ) : (
                      <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
                        {detail.byExam.map(renderExamRow)}
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}

      <Portal>
        <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)}>
          <Dialog.Title>Nova turma</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome da turma"
              mode="outlined"
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex.: 9º A"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onPress={handleAdd}>Salvar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  headerTitle: { marginBottom: 6 },
  headerHint: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  summaryCard: { marginBottom: 12, borderRadius: 4 },
  summaryInner: { paddingVertical: 8 },
  addBtn: { alignSelf: "flex-start" },
  list: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 32 },
  rowCard: { marginBottom: 10, borderRadius: 4 },
  turmaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingVertical: 4,
  },
  rowTitle: { fontWeight: "700", fontSize: 16 },
  expandSection: { paddingBottom: 4 },
  examRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  emptyInner: { paddingVertical: 24 },
  emptyText: { textAlign: "center", fontWeight: "600", marginBottom: 8 },
  emptySub: { textAlign: "center", lineHeight: 20 },
});
