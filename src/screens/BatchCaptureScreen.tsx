import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Dialog, IconButton, Portal, Text } from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';
import { classStorage, examStorage } from '../services/storage';
import { Class } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BatchCapture'>;

export function BatchCaptureScreen({ route, navigation }: Props) {
  const { examId } = route.params;
  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [showClassPicker, setShowClassPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const exam = await examStorage.get(examId);
      if (!exam) {
        navigation.goBack();
        return;
      }
      const allClasses = await classStorage.list();
      setClasses(allClasses);
      if (exam.classIds.length === 1) {
        setClassId(exam.classIds[0]);
      } else if (allClasses.length === 1) {
        setClassId(allClasses[0].id);
      } else {
        setShowClassPicker(true);
      }
    })();
  }, [examId, navigation]);

  const selectedClass = classes.find((c) => c.id === classId);

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Permita acesso à câmera nas configurações.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
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
      Alert.alert('Permissão negada', 'Permita acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 30,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUris((p) => [...p, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhoto = (uri: string) =>
    setPhotoUris((p) => p.filter((u) => u !== uri));

  const handleProcess = () => {
    if (!classId) {
      setShowClassPicker(true);
      return;
    }
    if (photoUris.length === 0) return;
    navigation.navigate('BatchReview', { examId, classId, photoUris });
  };

  const isReady = classId && photoUris.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg }}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.icon}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Correção em lote</Text>
              <Text style={styles.subtitle}>
                Adicione uma foto por aluno. A IA identifica nome e respostas
                automaticamente.
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Turma do lote</Text>
          <Pressable
            onPress={() => setShowClassPicker(true)}
            style={({ pressed }) => [
              styles.classPicker,
              pressed && { opacity: 0.85 },
              !selectedClass && styles.classPickerEmpty,
            ]}
          >
            {selectedClass ? (
              <>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>
                    {selectedClass.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.classPickerName}>{selectedClass.name}</Text>
              </>
            ) : (
              <Text style={styles.classPickerHint}>🏫 Selecionar turma</Text>
            )}
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.btnRow}>
            <Pressable
              onPress={pickFromCamera}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryBtnText}>📷  Câmera</Text>
            </Pressable>
            <Pressable
              onPress={pickFromLibrary}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.secondaryBtnText}>🖼  Galeria</Text>
            </Pressable>
          </View>

          <View style={styles.counterBox}>
            <Text style={styles.counterValue}>{photoUris.length}</Text>
            <Text style={styles.counterLabel}>
              prova{photoUris.length === 1 ? '' : 's'} na fila
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={photoUris}
        keyExtractor={(uri) => uri}
        numColumns={3}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 120 }}
        renderItem={({ item, index }) => (
          <View style={styles.photoCard}>
            <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            <View style={styles.photoIndex}>
              <Text style={styles.photoIndexText}>{index + 1}</Text>
            </View>
            <IconButton
              icon="close"
              size={14}
              iconColor="#ffffff"
              containerColor={colors.danger}
              style={styles.removeBtn}
              onPress={() => removePhoto(item)}
            />
          </View>
        )}
      />

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handleProcess}
          disabled={!isReady}
          icon="auto-fix"
          contentStyle={{ paddingVertical: spacing.sm, flexDirection: 'row-reverse' }}
        >
          Processar com IA
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showClassPicker}
          onDismiss={() => setShowClassPicker(false)}
        >
          <Dialog.Title>Selecionar turma do lote</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              {classes.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setClassId(c.id);
                    setShowClassPicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.dialogRow,
                    pressed && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <View style={styles.smallAvatar}>
                    <Text style={styles.smallAvatarText}>
                      {c.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.dialogRowText}>{c.name}</Text>
                  {classId === c.id ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowClassPicker(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: { fontSize: 36 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  fieldLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  classPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    gap: spacing.md,
  },
  classPickerEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  classPickerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  classPickerHint: { flex: 1, fontSize: 14, color: colors.textMuted },
  chevron: { fontSize: 22, color: colors.textMuted },

  btnRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  counterValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  counterLabel: { fontSize: 13, color: colors.textSecondary },

  photoCard: {
    flex: 1 / 3,
    aspectRatio: 0.85,
    margin: 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: { width: '100%', height: '100%' },
  photoIndex: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  photoIndexText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  removeBtn: { position: 'absolute', top: 0, right: 0, margin: 0 },

  bottomBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },

  dialogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarText: { color: '#ffffff', fontWeight: '800' },
  dialogRowText: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  checkmark: { color: colors.primary, fontSize: 18, fontWeight: '700' },
});
