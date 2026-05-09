import { createContext, useContext, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { cn } from '../../lib/utils';

interface TabsContextProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextProps>({
  activeTab: '',
  setActiveTab: () => {},
});

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function Tabs({ defaultValue, value, onValueChange, children }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalTab;

  const setActiveTab = (next: string) => {
    if (!isControlled) setInternalTab(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn('flex flex-row bg-bg-muted rounded-xl p-1 gap-1', className)}
      {...props}
    />
  );
}

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity> {
  value: string;
  title: string;
  textClasses?: string;
}

function TabsTrigger({
  value,
  title,
  className,
  textClasses,
  ...props
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const active = activeTab === value;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={cn(
        'flex-1 px-3 py-2 rounded-lg items-center justify-center',
        active ? 'bg-bg-surface' : 'bg-transparent',
        className,
      )}
      onPress={() => setActiveTab(value)}
      {...props}
    >
      <Text
        className={cn(
          'text-[13px] font-semibold',
          active ? 'text-ink' : 'text-ink-muted',
          textClasses,
        )}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  value: string;
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { activeTab } = useContext(TabsContext);
  if (value !== activeTab) return null;
  return <View className={cn('mt-2', className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
