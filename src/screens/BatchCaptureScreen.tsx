import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
  DialogScrollArea,
  DialogTitle,
} from '../components/ui/Dialog';
import { IconButton } from '../components/ui/IconButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { classStorage, examStorage } from '../services/storage';
import { Class } from '../types';
import { colors, radius, spacing } from '../theme';
import { materializePickerAsset } from '../utils/materializePickerAsset';

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
      selectionLimit: 30,
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
          {selectedClass ? (
            <Pressable
              onPress={() => setShowClassPicker(true)}
              className="flex-row items-center bg-brand-50 rounded-xl p-3 gap-3 active:opacity-85"
            >
              <View className="w-10 h-10 rounded-full bg-brand-500 items-center justify-center">
                <Text className="text-white font-extrabold text-[16px]">
                  {selectedClass.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                className="flex-1 text-[16px] font-bold text-brand-700"
                numberOfLines={1}
              >
                {selectedClass.name}
              </Text>
              <Text className="text-[13px] font-semibold text-brand-500">
                Trocar
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowClassPicker(true)}
              className="flex-row items-center bg-bg-surface border border-line border-dashed rounded-xl p-3 gap-3 active:opacity-85"
            >
              <View className="w-10 h-10 rounded-full bg-bg-muted items-center justify-center">
                <Ionicons name="school-outline" size={20} color={colors.textMuted} />
              </View>
              <Text className="flex-1 text-[14px] text-ink-muted font-medium">
                Toque para selecionar
              </Text>
              <Text className="text-[13px] font-semibold text-brand-500">
                Selecionar
              </Text>
            </Pressable>
          )}

          <View style={styles.btnRow}>
            <Button
              style={{ flex: 1 }}
              iconLeft={<Ionicons name="camera-outline" size={18} color="#ffffff" />}
              onPress={pickFromCamera}
            >
              Câmera
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

          <View style={styles.counterBox}>
            <Text style={styles.counterValue}>{photoUris.length}</Text>
            <Text style={styles.counterLabel}>
              {photoUris.length === 1 ? 'avaliação na fila' : 'avaliações na fila'}
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
          onPress={handleProcess}
          disabled={!isReady}
          iconRight={<Ionicons name="sparkles-outline" size={18} color="#ffffff" />}
        >
          Processar com IA
        </Button>
      </View>

      <Dialog
        open={showClassPicker}
        onOpenChange={(o) => !o && setShowClassPicker(false)}
      >
        <DialogTitle>Selecionar turma do lote</DialogTitle>
        <DialogScrollArea>
          {classes.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setClassId(c.id);
                setShowClassPicker(false);
              }}
              className="flex-row items-center py-3 px-5 gap-3 active:bg-brand-50"
            >
              <View className="w-9 h-9 rounded-full bg-brand-50 items-center justify-center">
                <Text className="text-brand-700 font-bold">
                  {c.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                className="flex-1 text-[15px] text-ink font-medium"
                numberOfLines={1}
              >
                {c.name}
              </Text>
              {classId === c.id ? (
                <Text className="text-brand-500 text-[20px] font-extrabold">
                  ✓
                </Text>
              ) : null}
            </Pressable>
          ))}
        </DialogScrollArea>
        <DialogActions>
          <Button variant="ghost" onPress={() => setShowClassPicker(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
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
  btnRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm },
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
});
