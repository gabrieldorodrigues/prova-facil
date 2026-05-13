import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/ui/Button';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogScrollArea,
  DialogTitle,
} from '../components/ui/Dialog';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { RootStackParamList } from '../navigation/AppNavigator';
import { classStorage, examStorage, studentStorage } from '../services/storage';
import { Class, Student } from '../types';
import { colors, radius, spacing } from '../theme';
import { materializePickerAsset } from '../utils/materializePickerAsset';

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

  const loadExamStudents = useCallback(async () => {
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
    sts.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    setClasses(cls);
    setStudents(sts);
    setSelectedId((prev) => {
      if (!prev) return null;
      return sts.some((s) => s.id === prev) ? prev : null;
    });
    if (cls.length === 1) setNewStudentClassId(cls[0].id);
  }, [examId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadExamStudents();
    }, [loadExamStudents]),
  );

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
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = await materializePickerAsset(result.assets[0], { preferBase64: false });
      setPhotoUris((p) => [...p, uri]);
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
      base64: true,
      ...(Platform.OS === 'ios' && {
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      }),
    });
    if (!result.canceled) {
      const uris = await Promise.all(
        result.assets.map((a) => materializePickerAsset(a, { preferBase64: true })),
      );
      setPhotoUris((p) => [...p, ...uris]);
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

  const step1Summary = useMemo(() => {
    const nClass = classes.length;
    const nStu = students.length;
    if (nClass === 0) return 'Carregando turmas…';
    if (nStu === 0)
      return `Nenhum aluno cadastrado nas ${nClass === 1 ? 'turma desta prova' : `${nClass} turmas desta prova`}.`;
    const turmaWord = nClass === 1 ? 'turma' : 'turmas';
    const alunoWord = nStu === 1 ? 'aluno' : 'alunos';
    return `${nStu} ${alunoWord} em ${nClass} ${turmaWord} — toque abaixo para escolher.`;
  }, [classes.length, students.length]);

  const openNewStudentDialog = () => {
    if (classes.length === 1) setNewStudentClassId(classes[0].id);
    else setNewStudentClassId(null);
    setShowAddStudent(true);
  };

  const openStudentPicker = useCallback(async () => {
    await loadExamStudents();
    setShowStudentPicker(true);
  }, [loadExamStudents]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ padding: spacing.lg }}>
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Passo 1 de 3</Text>
          <Text style={styles.stepTitle}>Identifique o aluno</Text>
          <Text style={styles.stepHint}>
            Indique quem fez esta prova: escolha alguém já cadastrado ou cadastre
            um aluno novo (só aparecem turmas ligadas a esta avaliação).
          </Text>

          <Text style={styles.step1Summary}>{step1Summary}</Text>

          {selectedStudent ? (
            <View style={styles.selectedStudentBlock}>
              <View style={styles.selectedStudentRow}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedBadge}>Aluno selecionado</Text>
                  <Text style={styles.studentName}>{selectedStudent.name}</Text>
                  {selectedClass ? (
                    <Text style={styles.studentClass}>{selectedClass.name}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.selectedActions}>
                <Button
                  variant="tonal"
                  size="sm"
                  style={{ flex: 1 }}
                  iconLeft={
                    <Ionicons name="swap-horizontal" size={16} color={colors.primaryDark} />
                  }
                  onPress={() => void openStudentPicker()}
                >
                  Trocar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1 }}
                  iconLeft={
                    <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                  }
                  onPress={openNewStudentDialog}
                >
                  Novo aluno
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.step1Actions}>
              <Button
                variant="tonal"
                iconLeft={
                  <Ionicons name="list-outline" size={18} color={colors.primaryDark} />
                }
                onPress={() => void openStudentPicker()}
              >
                Escolher aluno na lista
              </Button>
              <Button
                variant="secondary"
                iconLeft={
                  <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                }
                onPress={openNewStudentDialog}
              >
                Cadastrar aluno novo
              </Button>
            </View>
          )}
        </View>

        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.stepLabel}>Passo 2 de 3</Text>
          <Text style={styles.stepTitle}>Fotografe a prova</Text>
          <Text style={styles.stepHint}>
            Várias fotos se a prova tiver mais de uma página.
          </Text>

          <View style={styles.photoButtons}>
            <Button
              style={{ flex: 1 }}
              iconLeft={<Ionicons name="camera-outline" size={18} color="#ffffff" />}
              onPress={pickFromCamera}
            >
              Tirar foto
            </Button>
            <Button
              variant="tonal"
              style={{ flex: 1 }}
              iconLeft={<Ionicons name="images-outline" size={18} color={colors.primaryDark} />}
              onPress={pickFromLibrary}
            >
              Galeria
            </Button>
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
              color="#ffffff"
              bgColor={colors.danger}
              accessibilityLabel="Remover foto"
              style={styles.removeBtn}
              onPress={() => removePhoto(item)}
            />
          </View>
        )}
      />

      <View style={styles.bottomBar}>
        <Button
          size="lg"
          onPress={handleContinue}
          disabled={!isReady}
          iconRight={<Ionicons name="arrow-forward" size={18} color="#ffffff" />}
        >
          Continuar para revisão
        </Button>
      </View>

      <Dialog
        open={showStudentPicker}
        onOpenChange={(o) => !o && setShowStudentPicker(false)}
      >
        <DialogTitle>Escolher aluno</DialogTitle>
        <DialogScrollArea>
          <Text className="px-5 pb-3 text-[13px] text-ink-muted leading-[18px]">
            Lista agrupada por turma. Só entram turmas em que esta prova está
            disponível.
          </Text>
          {students.length === 0 ? (
            <View className="px-5 py-5 items-center">
              <Ionicons name="people-outline" size={40} color="#94a3b8" />
              <Text className="text-ink-muted text-center text-[14px] mt-3 leading-[20px]">
                Ainda não há alunos nestas turmas. Use o botão abaixo para
                cadastrar o primeiro.
              </Text>
            </View>
          ) : (
            classes.map((c) => {
              const list = studentsByClass.get(c.id) ?? [];
              if (list.length === 0) return null;
              return (
                <View key={c.id} className="mb-1">
                  <View className="mx-3 mt-2 mb-1 px-3 py-2 rounded-lg bg-brand-50">
                    <Text className="text-[12px] font-bold text-brand-800 uppercase tracking-wide">
                      Turma · {c.name}
                    </Text>
                  </View>
                  {list.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => {
                        setSelectedId(s.id);
                        setShowStudentPicker(false);
                      }}
                      className="flex-row items-center py-3 px-5 gap-3 active:bg-brand-50"
                    >
                      <View className="w-9 h-9 rounded-full bg-brand-100 items-center justify-center">
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
                      {selectedId === s.id ? (
                        <Ionicons name="checkmark-circle" size={22} color="#2C5F9E" />
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
              openNewStudentDialog();
            }}
            className="flex-row items-center py-3 px-5 gap-3 active:bg-brand-50 border-t border-line mt-1"
          >
            <View className="w-9 h-9 rounded-full bg-brand-100 items-center justify-center">
              <Ionicons name="person-add-outline" size={20} color="#1A3A5F" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-brand-700">
                Cadastrar aluno novo
              </Text>
              <Text className="text-[12px] text-ink-muted mt-0.5">
                Nome e turma (turmas desta prova)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        </DialogScrollArea>
        <DialogActions>
          <Button variant="ghost" onPress={() => setShowStudentPicker(false)}>
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
          <Input
            label="Nome do aluno"
            value={newStudentName}
            onChangeText={setNewStudentName}
            placeholder="Ex.: João Silva"
            autoFocus
            autoCapitalize="words"
            containerClasses={classes.length > 1 ? 'mt-2' : ''}
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

  step1Summary: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  step1Actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  selectedStudentBlock: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    gap: spacing.md,
  },
  selectedStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  selectedActions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  studentName: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },
  studentClass: { fontSize: 12, color: colors.primaryDark, opacity: 0.85, marginTop: 2 },

  photoButtons: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
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

  fieldLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
