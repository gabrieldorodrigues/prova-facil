import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Class } from '../types';
import { Button } from './ui/Button';
import {
  Dialog,
  DialogActions,
  DialogScrollArea,
  DialogTitle,
} from './ui/Dialog';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  classes: Class[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreateNew?: () => void;
}

export function ClassMultiSelectDialog({
  visible,
  onDismiss,
  classes,
  selectedIds,
  onToggle,
  onCreateNew,
}: Props) {
  return (
    <Dialog open={visible} onOpenChange={(o) => !o && onDismiss()}>
      <DialogTitle>Selecionar turmas</DialogTitle>
      <DialogScrollArea>
        {classes.length === 0 ? (
          <View className="px-5 py-6">
            <Text className="text-ink-subtle text-center">
              Nenhuma turma cadastrada ainda.
            </Text>
          </View>
        ) : (
          classes.map((c) => {
            const checked = selectedIds.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => onToggle(c.id)}
                className="flex-row items-center py-3 px-5 gap-3 active:bg-brand-50"
              >
                <View className="w-8 h-8 rounded-full bg-brand-50 items-center justify-center">
                  <Text className="text-brand-700 font-bold">
                    {c.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="flex-1 text-[15px] text-ink font-medium">
                  {c.name}
                </Text>
                {checked ? (
                  <Text className="text-brand-500 text-[20px] font-extrabold">
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            );
          })
        )}
        {onCreateNew ? (
          <Pressable
            onPress={onCreateNew}
            className="flex-row items-center py-3 px-5 gap-3 active:bg-brand-50 border-t border-line"
          >
            <View className="w-8 h-8 rounded-full bg-brand-50 items-center justify-center">
              <Text className="text-brand-700 font-bold text-[18px]">＋</Text>
            </View>
            <Text className="flex-1 text-[15px] font-semibold text-brand-500">
              Criar nova turma
            </Text>
          </Pressable>
        ) : null}
      </DialogScrollArea>
      <DialogActions>
        <Button onPress={onDismiss}>Concluir</Button>
      </DialogActions>
    </Dialog>
  );
}
