import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { paperDarkTheme } from './src/theme/appTheme';

export default function App() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: paperDarkTheme.colors.background }}
    >
      <SafeAreaProvider>
        <PaperProvider theme={paperDarkTheme}>
          <StatusBar style="light" />
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
