import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  IconButton,
  List,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { TurmasStackParamList } from '../navigation/AppNavigator';
import { turmasStorage } from '../services/turmasStorage';

type Props = NativeStackScreenProps<TurmasStackParamList, 'TurmasList'>;

export function TurmasScreen(_props: Props) {
  const theme = useTheme();
  const [turmas, setTurmas] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    setTurmas(await turmasStorage.list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAdd = async () => {
    const added = await turmasStorage.add(newName);
    if (!added) {
      Alert.alert('Atenção', 'Informe um nome para a turma.');
      return;
    }
    setNewName('');
    setDialogOpen(false);
    await load();
  };

  const handleRemove = (name: string) => {
    Alert.alert('Remover turma?', `A turma "${name}" sairá da lista (provas e correções não são apagadas).`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await turmasStorage.remove(name);
          await load();
        },
      },
    ]);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Suas turmas
        </Text>
        <Text style={[styles.headerHint, { color: theme.colors.onSurfaceVariant }]}>
          Use-as ao criar provas e ao corrigir. Você pode adicionar novas turmas a qualquer momento.
        </Text>
        <Button mode="contained-tonal" icon="plus" onPress={() => setDialogOpen(true)} style={styles.addBtn}>
          Adicionar turma
        </Button>
      </View>

      {turmas.length === 0 ? (
        <Card style={{ marginHorizontal: 16, marginTop: 8 }} mode="elevated">
          <Card.Content style={styles.emptyInner}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>Nenhuma turma cadastrada ainda.</Text>
            <Text style={[styles.emptySub, { color: theme.colors.onSurfaceVariant }]}>
              Toque em &quot;Adicionar turma&quot; ou cadastre ao criar uma prova.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={turmas}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.rowCard} mode="elevated">
              <List.Item
                title={item}
                titleStyle={[styles.rowTitle, { color: theme.colors.onSurface }]}
                right={() => (
                  <IconButton
                    icon="delete-outline"
                    iconColor={theme.colors.error}
                    onPress={() => handleRemove(item)}
                  />
                )}
              />
            </Card>
          )}
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
  addBtn: { alignSelf: 'flex-start' },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  rowCard: { marginBottom: 10 },
  rowTitle: { fontWeight: '600' },
  emptyInner: { paddingVertical: 24 },
  emptyText: { textAlign: 'center', fontWeight: '600', marginBottom: 8 },
  emptySub: { textAlign: 'center', lineHeight: 20 },
});
