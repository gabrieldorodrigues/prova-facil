import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvaliaçõesStackParamList } from "../navigation/AppNavigator";
import { examStorage } from "../services/storage";
import { Exam } from "../types";

type Props = NativeStackScreenProps<AvaliaçõesStackParamList, "Assessments">;

export function AssessmentsScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [assessmentCount, setAssessmentCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      examStorage.list().then((exams) => {
        setAssessmentCount(exams.length);
      });
    }, []),
  );

  const handleCreateAssessment = () => {
    navigation.navigate("CreateAssessment");
  };

  const handleViewHistory = () => {
    navigation.getParent()?.navigate("Inicio");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          padding: 16,
          paddingBottom: Math.max(insets.bottom + 32, 32),
        },
      ]}
    >
      <View style={styles.statsSection}>
        <Card
          style={[
            styles.statCard,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Card.Content>
            <Text
              variant="headlineLarge"
              style={{ color: theme.colors.primary }}
            >
              {assessmentCount}
            </Text>
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Avaliações criadas
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionsSection}>
        <Card
          style={[
            styles.actionCard,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
          onPress={handleCreateAssessment}
        >
          <Card.Content style={styles.actionContent}>
            <View style={styles.iconContainer}>
              <Icon
                source="plus-circle"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.actionTextContainer}>
              <Text
                variant="titleMedium"
                style={[styles.actionTitle, { color: theme.colors.onSurface }]}
              >
                Criar Nova Avaliação
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.actionDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Crie uma nova avaliação com questões
              </Text>
            </View>
            <Icon
              source="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </Card.Content>
        </Card>

        <Card
          style={[
            styles.actionCard,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
          onPress={handleViewHistory}
        >
          <Card.Content style={styles.actionContent}>
            <View style={styles.iconContainer}>
              <Icon source="history" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text
                variant="titleMedium"
                style={[styles.actionTitle, { color: theme.colors.onSurface }]}
              >
                Ver Histórico
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.actionDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Acesse avaliações e correções anteriores
              </Text>
            </View>
            <Icon
              source="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </Card.Content>
        </Card>
      </View>

      <View style={styles.buttonSection}>
        <Button
          mode="contained"
          onPress={handleCreateAssessment}
          style={styles.mainButton}
          labelStyle={styles.buttonLabel}
          icon="plus"
        >
          Criar Nova Avaliação
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  statsSection: {
    marginBottom: 24,
  },
  statCard: {
    borderRadius: 12,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    borderRadius: 12,
    marginBottom: 8,
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
    width: 48,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  actionDescription: {
    lineHeight: 16,
  },
  buttonSection: {
    marginTop: 8,
  },
  mainButton: {
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
