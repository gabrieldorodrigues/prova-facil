import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CaptureScreen } from '../screens/CaptureScreen';
import { CreateExamScreen } from '../screens/CreateExamScreen';
import { ExamDetailScreen } from '../screens/ExamDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ReviewScreen } from '../screens/ReviewScreen';

export type RootStackParamList = {
  Home: undefined;
  CreateExam: undefined;
  ExamDetail: { examId: string };
  Capture: { examId: string };
  Review: { examId: string; studentName: string; photoUris: string[] };
  Result: {
    examId: string;
    studentName: string;
    photoUris: string[];
    detectedAnswers: Record<string, string>;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Prova Fácil' }}
        />
        <Stack.Screen
          name="CreateExam"
          component={CreateExamScreen}
          options={{ title: 'Nova Prova' }}
        />
        <Stack.Screen
          name="ExamDetail"
          component={ExamDetailScreen}
          options={{ title: 'Detalhes da Prova' }}
        />
        <Stack.Screen
          name="Capture"
          component={CaptureScreen}
          options={{ title: 'Capturar Prova' }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: 'Revisar Respostas' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: 'Resultado', headerBackVisible: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
