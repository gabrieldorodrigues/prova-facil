import React, { createContext, useContext } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
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
  const { height } = useWindowDimensions();
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
          className="justify-center flex-1 bg-black/50"
          onPress={close}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ justifyContent: "center" }}
          >
            <View
              style={{ maxHeight: height * 0.85 }}
              className={cn(
                "mx-6 bg-bg-surface rounded-2xl overflow-hidden flex flex-col",
                contentClasses,
              )}
            >
              {children}
            </View>
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
      className={cn(
        "text-[18px] font-bold text-ink px-5 pt-5 pb-2 flex-shrink-0",
        className,
      )}
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
  return (
    <View className={cn("px-5 py-2 flex-shrink-0", className)} {...props} />
  );
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
  const { height } = useWindowDimensions();
  // Avoid flex:1 here: inside a maxHeight-only column the ScrollView often gets 0 height on RN,
  // so list content (e.g. student picker) appears empty.
  const scrollMax = Math.min(Math.round(height * 0.58), 520);
  return (
    <ScrollView
      style={[{ maxHeight: scrollMax }, style]}
      className={className}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={true}
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
        "flex-row justify-end items-center gap-2 px-3 py-3 flex-shrink-0 border-t border-line",
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
