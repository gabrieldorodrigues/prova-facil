import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

import { cn } from '../../lib/utils';

const toastVariants = {
  default: 'bg-ink',
  destructive: 'bg-danger',
  success: 'bg-success-600',
  info: 'bg-brand-500',
};

type ToastVariant = keyof typeof toastVariants;

interface ToastItemProps {
  id: number;
  message: string;
  onHide: (id: number) => void;
  variant?: ToastVariant;
  duration?: number;
  showProgress?: boolean;
}

function ToastItem({
  id,
  message,
  onHide,
  variant = 'default',
  duration = 3000,
  showProgress = true,
}: ToastItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: Math.max(duration - 500, 200),
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onHide(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return (
    <Animated.View
      className={cn('mx-3 mb-2 px-4 py-3 rounded-xl shadow-md', toastVariants[variant])}
      style={{
        opacity,
        transform: [
          {
            translateY: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [-12, 0],
            }),
          },
        ],
      }}
    >
      <Text className="font-semibold text-white text-[14px]">{message}</Text>
      {showProgress ? (
        <View className="mt-2 h-1 rounded bg-white/20 overflow-hidden">
          <Animated.View
            className="bg-white/60 h-1 rounded"
            style={{
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
  duration?: number;
  showProgress?: boolean;
}

interface ToastContextProps {
  toast: (
    message: string,
    variant?: ToastVariant,
    duration?: number,
    showProgress?: boolean,
  ) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

let nextId = 1;

function ToastProvider({
  children,
  position = 'top',
}: {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast: ToastContextProps['toast'] = (
    message,
    variant = 'default',
    duration = 2800,
    showProgress = true,
  ) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId++, text: message, variant, duration, showProgress },
    ]);
  };

  const removeToast = (id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <View
        pointerEvents="none"
        className={cn('absolute left-0 right-0', {
          'top-[60px]': position === 'top',
          'bottom-[40px]': position === 'bottom',
        })}
      >
        {messages.map((m) => (
          <ToastItem
            key={m.id}
            id={m.id}
            message={m.text}
            variant={m.variant}
            duration={m.duration}
            showProgress={m.showProgress}
            onHide={removeToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export { ToastProvider, useToast };
export type { ToastVariant };
