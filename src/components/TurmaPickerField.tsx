import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Menu, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { turmasStorage } from '../services/turmasStorage';

type Props = {
  value: string;
  onChange: (className: string) => void;
  label?: string;
};

export function TurmaPickerField({ value, onChange, label = 'Turma' }: Props) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const refresh = useCallback(async () => {
    setTurmas(await turmasStorage.list());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openMenu = () => {
    refresh();
    setMenuOpen(true);
  };

  const select = (name: string) => {
    onChange(name);
    setMenuOpen(false);
  };

  const addNew = async () => {
    const added = await turmasStorage.add(newName);
    if (!added) return;
    await refresh();
    onChange(added);
    setNewName('');
    setDialogOpen(false);
    setMenuOpen(false);
  };

  const labelText = value.trim() ? value.trim() : 'Selecione a turma';

  return (
    <View style={styles.wrap}>
      <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            style={styles.anchor}
            contentStyle={styles.anchorContent}
            icon="chevron-down"
          >
            {labelText}
          </Button>
        }
      >
        {turmas.map((t) => (
          <Menu.Item key={t} onPress={() => select(t)} title={t} />
        ))}
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            setDialogOpen(true);
          }}
          title="Nova turma…"
        />
      </Menu>

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
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onPress={addNew}>Salvar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { marginBottom: 6 },
  anchor: { justifyContent: 'flex-start' },
  anchorContent: { justifyContent: 'flex-start' },
});
