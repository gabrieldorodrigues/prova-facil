import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput } from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

export function CaptureScreen({ route, navigation }: Props) {
  const { examId } = route.params;
  const [studentName, setStudentName] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

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
    if (!studentName.trim()) return Alert.alert('Atenção', 'Informe o nome do aluno.');
    if (photoUris.length === 0)
      return Alert.alert('Atenção', 'Adicione pelo menos uma foto da prova.');
    navigation.navigate('Review', {
      examId,
      studentName: studentName.trim(),
      photoUris,
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 16 }}>
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
          <Button mode="outlined" icon="image-multiple" onPress={pickFromLibrary}>
            Galeria
          </Button>
        </View>

        <Text variant="labelMedium" style={{ marginTop: 16, color: '#6b7280' }}>
          {photoUris.length === 0
            ? 'Nenhuma foto ainda'
            : `${photoUris.length} foto(s) anexada(s)`}
        </Text>
      </View>

      <FlatList
        data={photoUris}
        keyExtractor={(uri) => uri}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card style={styles.photoCard}>
            <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
            <IconButton
              icon="close-circle"
              size={24}
              iconColor="#dc2626"
              style={styles.removeBtn}
              onPress={() => removePhoto(item)}
            />
          </Card>
        )}
      />

      <View style={styles.bottomBar}>
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
  container: { flex: 1, backgroundColor: '#fff' },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  photoCard: { flex: 1, margin: 4, position: 'relative', overflow: 'hidden' },
  photo: { width: '100%', height: 160 },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'transparent',
  },
});
