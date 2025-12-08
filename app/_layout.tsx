import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { UserProvider } from '@/contexts/UserContext';
import { TodoProvider } from '@/contexts/TodoContext';
import { TagProvider } from '@/contexts/TagContext';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LoadingScreen from '@/components/loading-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading time (you can replace this with actual async operations)
        // For example: loading fonts, checking auth status, etc.
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
        // Hide the splash screen once loading is complete
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <UserProvider>
      <LanguageProvider>
        <AppThemeProvider>
          <TagProvider>
            <TodoProvider>
              <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat-select" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
                  <Stack.Screen name="timer" options={{ headerShown: false }} />
                  <Stack.Screen name="add-task" options={{ headerShown: false }} />
                  <Stack.Screen name="review" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
            </TodoProvider>
          </TagProvider>
        </AppThemeProvider>
      </LanguageProvider>
    </UserProvider>
  );
}
