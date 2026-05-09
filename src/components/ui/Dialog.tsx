import React, { createContext, useContext } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { cn } from "../../lib/utils";

interface DialogContextValue {
  close: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogProps {
  open?: boolean;
  visible?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
  children: React.ReactNode;
  contentClasses?: string;
}

export function Dialog({
  open,
  visible,
  onOpenChange,
  onDismiss,
  children,
  contentClasses,
}: DialogProps) {
  const isOpen = open ?? visible ?? false;
  const close = () => {
    onOpenChange?.(false);
    onDismiss?.();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={close}
    >
      <DialogContext.Provider value={{ close }}>
        <Pressable
          className="flex-1 bg-black/50 justify-center"
          onPress={close}
          keyboardShouldPersistTaps="handled"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Pressable
              onPress={() => {}}
              style={{ maxHeight: "85%" }}
              className={cn(
                "mx-6 bg-bg-surface rounded-2xl overflow-hidden",
                contentClasses,
              )}
            >
              {children}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </DialogContext.Provider>
    </Modal>
  );
}

export function DialogTitle({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn("text-[18px] font-bold text-ink px-5 pt-5 pb-2", className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function DialogContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return <View className={cn("px-5 pb-2", className)} {...props} />;
}

interface DialogScrollAreaProps extends React.ComponentPropsWithoutRef<
  typeof ScrollView
> {
  className?: string;
}

export function DialogScrollArea({
  className,
  contentContainerStyle,
  children,
  style,
  ...props
}: DialogScrollAreaProps) {
  return (
    <ScrollView
      style={[{ flexShrink: 1 }, style]}
      className={className}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function DialogActions({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn(
        "flex-row justify-end items-center gap-2 px-3 py-3",
        className,
      )}
      {...props}
    />
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within Dialog");
  return ctx;
}
