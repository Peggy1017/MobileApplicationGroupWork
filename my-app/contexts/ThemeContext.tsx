import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';
const PRIMARY_COLOR_KEY = '@app_primary_color';

const lightColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  primary: '#007AFF',
};

const darkColors = {
  background: '#303030', // Classic Dark 背景色
  surface: '#3A3A3A', // 稍浅的灰色，用于卡片
  text: '#D8D8CF', // Classic Dark 文字色
  textSecondary: '#A0A0A0', // 次要文字色
  border: '#4A4A4A', // 边框色
  primary: '#007AFF',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [primaryColor, setPrimaryColorState] = useState('#007AFF');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const savedColor = await AsyncStorage.getItem(PRIMARY_COLOR_KEY);
      
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
      if (savedColor) {
        setPrimaryColorState(savedColor);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setPrimaryColor = async (color: string) => {
    setPrimaryColorState(color);
    try {
      await AsyncStorage.setItem(PRIMARY_COLOR_KEY, color);
    } catch (error) {
      console.error('Error saving primary color:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;
  colors.primary = primaryColor;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        primaryColor,
        setPrimaryColor,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

