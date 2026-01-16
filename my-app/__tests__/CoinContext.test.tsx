import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoinProvider, useCoins } from '../contexts/CoinContext';
import { UserProvider, useUser } from '../contexts/UserContext';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../contexts/UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUser: jest.fn(),
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    isDarkMode: false,
    toggleDarkMode: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('CoinContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (useUser as jest.Mock).mockReturnValue({
      currentUser: 'testuser',
      isLoggedIn: true,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UserProvider>
      <CoinProvider>{children}</CoinProvider>
    </UserProvider>
  );

  it('should provide default coin values', () => {
    const { result } = renderHook(() => useCoins(), { wrapper });

    expect(result.current.balance).toBe(20);
    expect(result.current.totalEarned).toBe(20);
    expect(result.current.loginStreak).toBe(0);
    expect(result.current.ownedThemes).toContain('default_light');
    expect(result.current.ownedThemes).toContain('default_dark');
  });

  it('should check if theme is owned', () => {
    const { result } = renderHook(() => useCoins(), { wrapper });

    expect(result.current.isThemeOwned('default_light')).toBe(true);
    expect(result.current.isThemeOwned('default_dark')).toBe(true);
    expect(result.current.isThemeOwned('sunset_glow')).toBe(false);
  });

  it('should apply theme correctly', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        balance: 20,
        ownedThemes: ['default_light', 'default_dark'],
        currentTheme: 'default_light',
      })
    );

    const { result } = renderHook(() => useCoins(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTheme).toBeDefined();
    });

    await act(async () => {
      const applyResult = await result.current.applyTheme('default_dark');
      expect(applyResult.success).toBe(true);
    });

    expect(result.current.currentTheme).toBe('default_dark');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('should not apply theme if not owned', async () => {
    const { result } = renderHook(() => useCoins(), { wrapper });

    await act(async () => {
      const applyResult = await result.current.applyTheme('sunset_glow');
      expect(applyResult.success).toBe(false);
    });
  });

  it('should provide available themes', () => {
    const { result } = renderHook(() => useCoins(), { wrapper });

    expect(result.current.availableThemes).toBeDefined();
    expect(result.current.availableThemes.length).toBeGreaterThan(0);
    expect(result.current.availableThemes.find((t) => t.id === 'default_light')).toBeDefined();
    expect(result.current.availableThemes.find((t) => t.id === 'default_dark')).toBeDefined();
  });

  it('should provide current theme data', () => {
    const { result } = renderHook(() => useCoins(), { wrapper });

    expect(result.current.currentThemeData).toBeDefined();
    expect(result.current.currentThemeData?.id).toBe('default_light');
  });
});
