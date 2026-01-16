// Mock dependencies before imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';


describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  it('should provide light theme by default', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.isDarkMode).toBe(false);
    expect(result.current.colors.background).toBe('#F5F5F5');
    expect(result.current.colors.text).toBe('#1C1C1E');
    expect(result.current.colors.surface).toBe('#FFFFFF');
  });

  it('should toggle dark mode correctly', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.isDarkMode).toBe(false);

    await act(async () => {
      await result.current.toggleDarkMode();
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(result.current.colors.background).toBe('#1C1C1E');
    expect(result.current.colors.text).toBe('#FFFFFF');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app_theme', 'dark');
  });

  it('should load saved theme from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.isDarkMode).toBe(true);
    });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@app_theme');
  });

  it('should set primary color correctly', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await result.current.setPrimaryColor('#FF0000');
    });

    expect(result.current.primaryColor).toBe('#FF0000');
    expect(result.current.colors.primary).toBe('#FF0000');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app_primary_color', '#FF0000');
  });

  it('should load saved primary color from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === '@app_primary_color') return Promise.resolve('#00FF00');
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useTheme(), { wrapper });

    await waitFor(() => {
      expect(result.current.primaryColor).toBe('#00FF00');
    });

    expect(result.current.colors.primary).toBe('#00FF00');
  });

  it('should provide correct dark theme colors', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    await act(async () => {
      await result.current.toggleDarkMode();
    });

    expect(result.current.colors.background).toBe('#1C1C1E');
    expect(result.current.colors.surface).toBe('#2C2C2E');
    expect(result.current.colors.text).toBe('#FFFFFF');
    expect(result.current.colors.textSecondary).toBe('#8E8E93');
    expect(result.current.colors.border).toBe('#38383A');
  });

  it('should provide correct light theme colors', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.colors.background).toBe('#F5F5F5');
    expect(result.current.colors.surface).toBe('#FFFFFF');
    expect(result.current.colors.text).toBe('#1C1C1E');
    expect(result.current.colors.textSecondary).toBe('#8E8E93');
    expect(result.current.colors.border).toBe('#E5E5EA');
  });
});
