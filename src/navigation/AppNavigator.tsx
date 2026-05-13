import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { BatchCaptureScreen } from '../screens/BatchCaptureScreen';
import { BatchReviewScreen } from '../screens/BatchReviewScreen';
import { CaptureScreen } from '../screens/CaptureScreen';
import { ClassDetailScreen } from '../screens/ClassDetailScreen';
import { ClassesScreen } from '../screens/ClassesScreen';
import { CreateExamScreen } from '../screens/CreateExamScreen';
import { EditExamScreen } from '../screens/EditExamScreen';
import { ExamDetailScreen } from '../screens/ExamDetailScreen';
import { ExamsScreen } from '../screens/ExamsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { colors } from '../theme';

export type RootStackParamList = {
  MainTabs: undefined;
  Classes: undefined;
  ClassDetail: { classId: string };
  CreateExam: { classId?: string };
  EditExam: { examId: string };
  ExamDetail: { examId: string };
  Capture: { examId: string };
  BatchCapture: { examId: string };
  BatchReview: { examId: string; classId: string; photoUris: string[] };
  Review: {
    examId: string;
    studentId?: string;
    studentName: string;
    photoUris: string[];
    correctionId?: string;
  };
  Result: {
    examId: string;
    studentName: string;
    photoUris: string[];
    detectedAnswers: Record<string, string>;
    studentId?: string;
    correctionId?: string;
  };
};

export type TabParamList = {
  Home: undefined;
  TurmasTab: { openCreate?: boolean } | undefined;
  AvaliacoesTab: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          headerTitle: 'Avaliação Fácil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TurmasTab"
        component={ClassesScreen}
        options={{
          title: 'Turmas',
          tabBarLabel: 'Turmas',
          headerTitle: 'Turmas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AvaliacoesTab"
        component={ExamsScreen}
        options={{
          title: 'Avaliações',
          tabBarLabel: 'Avaliações',
          headerTitle: 'Avaliações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: 'Voltar',
        }}
      >
        <RootStack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="ClassDetail"
          component={ClassDetailScreen}
          options={{ title: 'Turma' }}
        />
        <RootStack.Screen
          name="CreateExam"
          component={CreateExamScreen}
          options={{ title: 'Nova avaliação' }}
        />
        <RootStack.Screen
          name="EditExam"
          component={EditExamScreen}
          options={{ title: 'Editar avaliação' }}
        />
        <RootStack.Screen
          name="ExamDetail"
          component={ExamDetailScreen}
          options={{ title: 'Detalhes' }}
        />
        <RootStack.Screen
          name="Capture"
          component={CaptureScreen}
          options={{ title: 'Corrigir Aluno' }}
        />
        <RootStack.Screen
          name="BatchCapture"
          component={BatchCaptureScreen}
          options={{ title: 'Lote' }}
        />
        <RootStack.Screen
          name="BatchReview"
          component={BatchReviewScreen}
          options={{ title: 'Revisão do Lote' }}
        />
        <RootStack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: 'Revisar' }}
        />
        <RootStack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: 'Resultado' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
