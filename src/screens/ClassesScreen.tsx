import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/Button';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '../components/ui/Dialog';
import { Fab } from '../components/ui/Fab';
import { Input } from '../components/ui/Input';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import { classStorage, examStorage, studentStorage } from '../services/storage';
import { Class } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<TabParamList, 'TurmasTab'>;

interface ClassWithStats extends Class {
  studentCount: number;
  examCount: number;
}

export function ClassesScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const all = await classStorage.list();
    const withStats: ClassWithStats[] = await Promise.all(
      all.map(async (c) => ({
        ...c,
        studentCount: (await studentStorage.listByClass(c.id)).length,
        examCount: (await examStorage.listByClass(c.id)).length,
      })),
    );
    setClasses(withStats);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      if (route.params?.openCreate) {
        setShowDialog(true);
        navigation.setParams({ openCreate: undefined } as never);
      }
    }, [load, route.params?.openCreate, navigation]),
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await classStorage.save({
      id: Crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    });
    setNewName('');
    setShowDialog(false);
    load();
  };

  if (!loading && classes.length === 0) {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <EmptyState
          emoji="🏫"
          title="Cadastre sua primeira turma"
          description="Organize suas avaliações por turma e reaproveite a lista de alunos em todas as provas."
          actionLabel="Criar turma"
          onAction={() => setShowDialog(true)}
        />
        <CreateDialog
          visible={showDialog}
          name={newName}
          onChangeName={setNewName}
          onClose={() => setShowDialog(false)}
          onCreate={handleCreate}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <Text className="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-3">
            {classes.length} turma(s) cadastrada(s)
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ClassDetail', { classId: item.id })}
            className="flex-row items-center bg-bg-surface p-3 rounded-2xl mb-2 gap-3 active:opacity-85 active:bg-bg-muted"
          >
            <View className="w-11 h-11 rounded-xl bg-brand-50 items-center justify-center">
              <Text className="text-brand-700 font-extrabold text-[18px]">
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-ink">{item.name}</Text>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-[12px] text-ink-muted">
                  👥 {item.studentCount} aluno{item.studentCount === 1 ? '' : 's'}
                </Text>
                <View className="w-1 h-1 rounded-full bg-ink-subtle mx-2" />
                <Text className="text-[12px] text-ink-muted">
                  📝 {item.examCount} prova{item.examCount === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
            <Text className="text-[28px] text-ink-subtle leading-7">›</Text>
          </Pressable>
        )}
      />

      <Fab
        icon="add"
        label="Nova turma"
        accessibilityLabel="Criar nova turma"
        onPress={() => setShowDialog(true)}
      />

      <CreateDialog
        visible={showDialog}
        name={newName}
        onChangeName={setNewName}
        onClose={() => setShowDialog(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

interface DialogProps {
  visible: boolean;
  name: string;
  onChangeName: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

function CreateDialog({ visible, name, onChangeName, onClose, onCreate }: DialogProps) {
  return (
    <Dialog open={visible} onOpenChange={(o) => !o && onClose()}>
      <DialogTitle>Nova turma</DialogTitle>
      <DialogContent>
        <Input
          label="Nome da turma"
          value={name}
          onChangeText={onChangeName}
          placeholder="Ex.: 9º A — Manhã"
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button variant="ghost" onPress={onClose}>
          Cancelar
        </Button>
        <Button onPress={onCreate} disabled={!name.trim()}>
          Criar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
