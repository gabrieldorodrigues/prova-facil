import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';
import { classStorage, examStorage, studentStorage } from '../services/storage';
import { Class, Student } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

export function CaptureScreen({ route, navigation }: Props) {
  const { examId } = route.params;
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const exam = await examStorage.get(examId);
      if (!exam) {
        navigation.goBack();
        return;
      }
      const cls: Class[] = [];
      const sts: Student[] = [];
      for (const cid of exam.classIds) {
        const c = await classStorage.get(cid);
        if (c) {
          cls.push(c);
          sts.push(...(await studentStorage.listByClass(cid)));
        }
      }
      setClasses(cls);
      setStudents(sts);
      if (cls.length === 1) setNewStudentClassId(cls[0].id);
    })();
  }, [examId, navigation]);

  const classMap = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes],
  );

  const selectedStudent = students.find((s) => s.id === selectedId);
  const selectedClass = selectedStudent ? classMap.get(selectedStudent.classId) : null;

  const handleAddStudent = async () => {
    const name = newStudentName.trim();
    const targetClassId = newStudentClassId ?? classes[0]?.id;
    if (!name || !targetClassId) return;
    const student: Student = {
      id: Crypto.randomUUID(),
      classId: targetClassId,
      name,
      createdAt: new Date().toISOString(),
    };
    await studentStorage.save(student);
    setStudents((prev) =>
      [...prev, student].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setSelectedId(student.id);
    setNewStudentName('');
    setShowAddStudent(false);
  };

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
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUris((p) => [...p, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhoto = (uri: string) =>
    setPhotoUris((p) => p.filter((u) => u !== uri));

  const handleContinue = () => {
    if (!selectedStudent)
      return Alert.alert('Atenção', 'Selecione o aluno antes de continuar.');
    if (photoUris.length === 0)
      return Alert.alert('Atenção', 'Adicione pelo menos uma foto da prova.');
    navigation.navigate('Review', {
      examId,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      photoUris,
    });
  };

  const isReady = !!selectedStudent && photoUris.length > 0;

  const studentsByClass = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const arr = map.get(s.classId) ?? [];
      arr.push(s);
      map.set(s.classId, arr);
    }
    return map;
  }, [students]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ padding: spacing.lg }}>
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Passo 1 de 3</Text>
          <Text style={styles.stepTitle}>Identifique o aluno</Text>

          <Pressable
            onPress={() => setShowStudentPicker(true)}
            style={({ pressed }) => [
              styles.studentPicker,
              pressed && { opacity: 0.85 },
              !selectedStudent && styles.studentPickerEmpty,
            ]}
          >
            {selectedStudent ? (
              <>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{selectedStudent.name}</Text>
                  {selectedClass ? (
                    <Text style={styles.studentClass}>{selectedClass.name}</Text>
                  ) : null}
                </View>
              </>
            ) : (
              <Text style={styles.studentHint}>👤 Selecionar aluno</Text>
            )}
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.stepLabel}>Passo 2 de 3</Text>
          <Text style={styles.stepTitle}>Fotografe a prova</Text>
          <Text style={styles.stepHint}>
            Várias fotos se a prova tiver mais de uma página.
          </Text>

          <View style={styles.photoButtons}>
            <Pressable
              onPress={pickFromCamera}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryBtnText}>📷  Tirar foto</Text>
            </Pressable>
            <Pressable
              onPress={pickFromLibrary}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.secondaryBtnText}>🖼  Galeria</Text>
            </Pressable>
          </View>

          <Text style={styles.photoCount}>
            {photoUris.length === 0
              ? 'Nenhuma foto anexada'
              : `${photoUris.length} foto(s) anexada(s)`}
          </Text>
        </View>
      </View>

      <FlatList
        data={photoUris}
        keyExtractor={(uri) => uri}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
        renderItem={({ item, index }) => (
          <View style={styles.photoCard}>
            <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            <View style={styles.photoIndex}>
              <Text style={styles.photoIndexText}>{index + 1}</Text>
            </View>
            <IconButton
              icon="close"
              size={18}
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
          onPress={handleContinue}
          disabled={!isReady}
          icon="arrow-right"
          contentStyle={{ paddingVertical: spacing.sm, flexDirection: 'row-reverse' }}
        >
          Continuar para revisão
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showStudentPicker}
          onDismiss={() => setShowStudentPicker(false)}
          style={{ maxHeight: '80%' }}
        >
          <Dialog.Title>Selecionar aluno</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              {students.length === 0 ? (
                <View style={{ padding: spacing.lg }}>
                  <Text style={{ color: colors.textMuted }}>
                    Nenhum aluno cadastrado nas turmas desta prova.
                  </Text>
                </View>
              ) : (
                classes.map((c) => {
                  const list = studentsByClass.get(c.id) ?? [];
                  if (list.length === 0) return null;
                  return (
                    <View key={c.id}>
                      <Text style={styles.dialogSection}>{c.name}</Text>
                      {list.map((s) => (
                        <Pressable
                          key={s.id}
                          onPress={() => {
                            setSelectedId(s.id);
                            setShowStudentPicker(false);
                          }}
                          style={({ pressed }) => [
                            styles.dialogRow,
                            pressed && { backgroundColor: colors.primaryLight },
                          ]}
                        >
                          <View style={styles.smallAvatar}>
                            <Text style={styles.smallAvatarText}>
                              {s.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.dialogRowText}>{s.name}</Text>
                          {selectedId === s.id ? (
                            <Text style={styles.checkmark}>✓</Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  );
                })
              )}
              <Pressable
                onPress={() => {
                  setShowStudentPicker(false);
                  if (classes.length === 1) setNewStudentClassId(classes[0].id);
                  setShowAddStudent(true);
                }}
                style={({ pressed }) => [
                  styles.dialogRow,
                  pressed && { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text style={[styles.dialogRowText, { color: colors.primary }]}>
                  ＋ Adicionar aluno
                </Text>
              </Pressable>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowStudentPicker(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showAddStudent}
          onDismiss={() => setShowAddStudent(false)}
        >
          <Dialog.Title>Novo aluno</Dialog.Title>
          <Dialog.Content>
            {classes.length > 1 ? (
              <>
                <Text style={styles.fieldLabel}>Turma</Text>
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
                          newStudentClassId === c.id && { color: '#ffffff' },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <TextInput
              label="Nome do aluno"
              mode="outlined"
              value={newStudentName}
              onChangeText={setNewStudentName}
              placeholder="Ex.: João Silva"
              autoFocus
              autoCapitalize="words"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={{ marginTop: classes.length > 1 ? spacing.sm : 0 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddStudent(false)}>Cancelar</Button>
            <Button
              onPress={handleAddStudent}
              disabled={!newStudentName.trim() || !newStudentClassId}
            >
              Adicionar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  stepHint: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  studentPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  studentPickerEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { color: '#ffffff', fontWeight: '800' },
  studentName: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  studentClass: { fontSize: 11, color: colors.primaryDark, opacity: 0.8 },
  studentHint: { flex: 1, fontSize: 14, color: colors.textMuted },
  chevron: { fontSize: 22, color: colors.textMuted },

  photoButtons: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
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
  photoCount: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md },

  photoCard: {
    flex: 1,
    margin: 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: { width: '100%', height: 180 },
  photoIndex: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  photoIndexText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  removeBtn: { position: 'absolute', top: 4, right: 4, margin: 0 },
  bottomBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },

  dialogSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarText: { color: colors.primaryDark, fontWeight: '700' },
  dialogRowText: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  checkmark: { color: colors.primary, fontSize: 18, fontWeight: '700' },

  fieldLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  classChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  classChoiceChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  classChoiceText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
});
