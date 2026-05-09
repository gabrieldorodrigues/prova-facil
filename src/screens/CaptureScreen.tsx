import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TurmaPickerField } from "../components/TurmaPickerField";
import { HomeStackParamList } from "../navigation/AppNavigator";
import { examStorage } from "../services/storage";

type Props = NativeStackScreenProps<HomeStackParamList, "Capture">;

export function CaptureScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { examId } = route.params;
  const insets = useSafeAreaInsets();
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [examTitle, setExamTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const e = await examStorage.get(examId);
      if (!e || cancelled) return;
      setExamTitle(e.name);
      setClassName((prev) => (prev.trim() ? prev : e.className));
    })();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão negada",
        "Permita acesso à câmera nas configurações.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUris((p) => [...p, result.assets[0].uri]);
    }
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão negada",
        "Permita acesso à galeria nas configurações.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUris((p) => [...p, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhoto = (uri: string) =>
    setPhotoUris((p) => p.filter((u) => u !== uri));

  const handleContinue = () => {
    if (!studentName.trim())
      return Alert.alert("Atenção", "Informe o nome do aluno.");
    if (!className.trim())
      return Alert.alert("Atenção", "Selecione ou cadastre a turma.");
    if (photoUris.length === 0)
      return Alert.alert(
        "Atenção",
        "Adicione pelo menos uma foto da avaliação.",
      );
    navigation.navigate("Review", {
      examId,
      studentName: studentName.trim(),
      photoUris,
      className: className.trim(),
    });
  };

  const bottomOffset = 16 + insets.bottom;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={{ padding: 16 }}>
        {examTitle ? (
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            {examTitle}
          </Text>
        ) : null}
        <Text
          variant="bodyMedium"
          style={[styles.sectionHint, { color: theme.colors.onSurfaceVariant }]}
        >
          Dados do aluno e turma
        </Text>

        <TurmaPickerField value={className} onChange={setClassName} />

        <TextInput
          label="Nome do aluno"
          mode="outlined"
          value={studentName}
          onChangeText={setStudentName}
          autoCapitalize="words"
          style={{ marginBottom: 12 }}
        />

        <View style={styles.btnRow}>
          <Button
            mode="contained"
            icon="camera"
            onPress={pickFromCamera}
            style={{ flex: 1, marginRight: 8 }}
          >
            Tirar foto
          </Button>
          <Button
            mode="outlined"
            icon="image-multiple"
            onPress={pickFromLibrary}
          >
            Galeria
          </Button>
        </View>

        <Text
          variant="labelMedium"
          style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}
        >
          {photoUris.length === 0
            ? "Nenhuma foto ainda"
            : `${photoUris.length} foto(s) anexada(s)`}
        </Text>
      </View>

      <FlatList
        data={photoUris}
        keyExtractor={(uri) => uri}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120 + bottomOffset,
        }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Card style={[styles.photoCard, { borderRadius: 4 }]} mode="elevated">
            <Image
              source={{ uri: item }}
              style={styles.photo}
              resizeMode="cover"
            />
            <IconButton
              icon="close-circle"
              size={24}
              iconColor={theme.colors.error}
              style={[
                styles.removeBtn,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => removePhoto(item)}
            />
          </Card>
        )}
      />

      <View style={[styles.bottomBar, { bottom: bottomOffset }]}>
        <Button
          mode="contained"
          onPress={handleContinue}
          contentStyle={{ paddingVertical: 6 }}
        >
          Continuar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { marginBottom: 4 },
  sectionHint: { marginBottom: 12 },
  btnRow: { flexDirection: "row", alignItems: "center" },
  photoCard: { flex: 1, margin: 4, position: "relative", overflow: "hidden" },
  photo: { width: "100%", height: 160 },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "transparent",
  },
});
