import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useMemo } from 'react';
import { Icon, useTheme } from 'react-native-paper';
import { CaptureScreen } from '../screens/CaptureScreen';
import { CreateExamScreen } from '../screens/CreateExamScreen';
import { ExamDetailScreen } from '../screens/ExamDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { TurmasScreen } from '../screens/TurmasScreen';
import { turmasStorage } from '../services/turmasStorage';
import { navigationDarkTheme, paperDarkTheme } from '../theme/appTheme';

type PaperTheme = typeof paperDarkTheme;

export type HomeStackParamList = {
  Home: undefined;
  ExamDetail: { examId: string };
  Capture: { examId: string };
  Review: {
    examId: string;
    studentName: string;
    photoUris: string[];
    className: string;
  };
  Result: {
    examId: string;
    studentName: string;
    photoUris: string[];
    detectedAnswers: Record<string, string>;
    className: string;
  };
};

export type NovaStackParamList = {
  CreateExam: undefined;
};

export type TurmasStackParamList = {
  TurmasList: undefined;
};

export type RootTabParamList = {
  Inicio: undefined;
  NovaProva: undefined;
  Turmas: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const NovaStack = createNativeStackNavigator<NovaStackParamList>();
const TurmasStack = createNativeStackNavigator<TurmasStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function stackOptions(theme: PaperTheme) {
  return {
    headerStyle: {
      backgroundColor: theme.colors.surface,
    },
    headerTintColor: theme.colors.onSurface,
    headerTitleStyle: { fontWeight: '600' as const, color: theme.colors.onSurface },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background },
  };
}

function HomeStackNavigator({ theme }: { theme: PaperTheme }) {
  return (
    <HomeStack.Navigator screenOptions={stackOptions(theme)}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Prova Fácil' }}
      />
      <HomeStack.Screen
        name="ExamDetail"
        component={ExamDetailScreen}
        options={{ title: 'Detalhes da Prova' }}
      />
      <HomeStack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{ title: 'Capturar Prova' }}
      />
      <HomeStack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ title: 'Revisar Respostas' }}
      />
      <HomeStack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Resultado', headerBackVisible: false }}
      />
    </HomeStack.Navigator>
  );
}

function NovaStackNavigator({ theme }: { theme: PaperTheme }) {
  return (
    <NovaStack.Navigator screenOptions={stackOptions(theme)}>
      <NovaStack.Screen
        name="CreateExam"
        component={CreateExamScreen}
        options={{ title: 'Nova Prova' }}
      />
    </NovaStack.Navigator>
  );
}

function TurmasStackNavigator({ theme }: { theme: PaperTheme }) {
  return (
    <TurmasStack.Navigator screenOptions={stackOptions(theme)}>
      <TurmasStack.Screen
        name="TurmasList"
        component={TurmasScreen}
        options={{ title: 'Turmas' }}
      />
    </TurmasStack.Navigator>
  );
}

function InicioTabStack() {
  const theme = useTheme();
  return <HomeStackNavigator theme={theme as PaperTheme} />;
}

function NovaProvaTabStack() {
  const theme = useTheme();
  return <NovaStackNavigator theme={theme as PaperTheme} />;
}

function TurmasTabStack() {
  const theme = useTheme();
  return <TurmasStackNavigator theme={theme as PaperTheme} />;
}

function MainTabs() {
  const theme = useTheme();
  const tabOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.outlineVariant,
        borderTopWidth: 1,
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' as const },
    }),
    [theme],
  );

  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Inicio"
        component={InicioTabStack}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Icon source="home-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="NovaProva"
        component={NovaProvaTabStack}
        options={{
          title: 'Nova prova',
          tabBarIcon: ({ color, size }) => (
            <Icon source="file-document-edit-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Turmas"
        component={TurmasTabStack}
        options={{
          title: 'Turmas',
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-group-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  useEffect(() => {
    turmasStorage.seedFromExamsIfNeeded().catch(() => {});
  }, []);

  return (
    <NavigationContainer theme={navigationDarkTheme}>
      <MainTabs />
    </NavigationContainer>
  );
}
