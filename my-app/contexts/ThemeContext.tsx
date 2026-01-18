import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser } from './UserContext';
import { API_URL } from '@/utils/apiConfig';

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
  const { currentUser, isLoggedIn } = useUser();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [primaryColor, setPrimaryColorState] = useState('#007AFF');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  // 当用户登录状态改变时，加载用户的主色调
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadUserPrimaryColor();
    } else if (!isLoggedIn) {
      // 未登录时，使用本地存储的主色调
      loadLocalPrimaryColor();
    }
  }, [isLoggedIn, currentUser]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const loadLocalPrimaryColor = async () => {
    try {
      const savedColor = await AsyncStorage.getItem(PRIMARY_COLOR_KEY);
      if (savedColor) {
        setPrimaryColorState(savedColor);
      }
    } catch (error) {
      console.error('Error loading local primary color:', error);
    }
  };

  const loadUserPrimaryColor = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_URL}/users/${currentUser}/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.primaryColor) {
          setPrimaryColorState(data.primaryColor);
        }
      } else {
        // 如果获取失败，尝试使用本地存储的主色调
        await loadLocalPrimaryColor();
      }
    } catch (error) {
      console.error('Error loading user primary color:', error);
      // 如果网络错误，使用本地存储的主色调
      await loadLocalPrimaryColor();
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
    
    // 保存到本地存储（作为备份）
    try {
      await AsyncStorage.setItem(PRIMARY_COLOR_KEY, color);
    } catch (error) {
      console.error('Error saving primary color to local storage:', error);
    }
    
    // 如果用户已登录，同步到后端
    if (isLoggedIn && currentUser) {
      try {
        const response = await fetch(`${API_URL}/users/${currentUser}/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ primaryColor: color }),
        });
        
        if (!response.ok) {
          console.error('Failed to save primary color to server');
        }
      } catch (error) {
        console.error('Error saving primary color to server:', error);
      }
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

