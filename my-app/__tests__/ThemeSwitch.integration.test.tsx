/**
 * Theme Switch Integration Test
 * Tests the complete flow of switching between Classic Light and Classic Dark themes
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { CoinProvider, useCoins } from '../contexts/CoinContext';
import { UserProvider } from '../contexts/UserContext';

// Mock dependencies
// Create a mock storage that actually stores values
const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  }),
}));

jest.mock('../hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('../contexts/UserContext', () => {
  const React = require('react');
  return {
    UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useUser: jest.fn(() => ({
      currentUser: 'testuser',
      isLoggedIn: true,
    })),
  };
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        balance: 20,
        totalEarned: 20,
        ownedThemes: ['default_light', 'default_dark'],
        currentTheme: 'default_light',
        loginStreak: 0,
      }),
  })
) as jest.Mock;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <ThemeProvider>
      <CoinProvider>{children}</CoinProvider>
    </ThemeProvider>
  </UserProvider>
);

describe('Theme Switch Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear mock storage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    // Reset mocks to use the mock storage
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => 
      Promise.resolve(mockStorage[key] || null)
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    });
  });

  it('should switch from Classic Light to Classic Dark', async () => {
    const { result: themeResult } = renderHook(() => useTheme(), {
      wrapper: TestWrapper,
    });

    const { result: coinResult } = renderHook(() => useCoins(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(coinResult.current.currentTheme).toBeDefined();
    });

    // Initial state: Light theme
    expect(themeResult.current.isDarkMode).toBe(false);
    expect(coinResult.current.currentTheme).toBe('default_light');
    expect(themeResult.current.colors.background).toBe('#F5F5F5');
    expect(themeResult.current.colors.text).toBe('#1C1C1E');

    // Switch to Classic Dark
    await act(async () => {
      const result = await coinResult.current.applyTheme('default_dark');
      expect(result.success).toBe(true);
    });

    // Wait for theme to be applied
    await waitFor(
      () => {
        expect(coinResult.current.currentTheme).toBe('default_dark');
      },
      { timeout: 3000 }
    );

    // Wait for ThemeContext to sync - toggleDarkMode is called inside applyTheme
    await waitFor(
      () => {
        expect(themeResult.current.isDarkMode).toBe(true);
      },
      { 
        timeout: 10000, 
        interval: 200,
        onTimeout: (error) => {
          error.message = `ThemeContext did not sync to dark mode. Current isDarkMode: ${themeResult.current.isDarkMode}, currentTheme: ${coinResult.current.currentTheme}`;
          return error;
        }
      }
    );

    // Verify dark theme colors
    expect(themeResult.current.colors.background).toBe('#1C1C1E');
    expect(themeResult.current.colors.text).toBe('#FFFFFF');
  });

  it('should switch from Classic Dark to Classic Light', async () => {
    // Start with dark theme
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === '@app_theme') return Promise.resolve('dark');
      if (key === '@user_coins')
        return Promise.resolve(
          JSON.stringify({
            balance: 20,
            ownedThemes: ['default_light', 'default_dark'],
            currentTheme: 'default_dark',
          })
        );
      return Promise.resolve(null);
    });

    const { result: themeResult } = renderHook(() => useTheme(), {
      wrapper: TestWrapper,
    });

    const { result: coinResult } = renderHook(() => useCoins(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(themeResult.current.isDarkMode).toBe(true);
    });

    // Switch to Classic Light
    await act(async () => {
      const result = await coinResult.current.applyTheme('default_light');
      expect(result.success).toBe(true);
    });

    // Wait for theme to be applied
    await waitFor(
      () => {
        expect(coinResult.current.currentTheme).toBe('default_light');
      },
      { timeout: 5000 }
    );

    // Strategy: Wait for ThemeContext to sync with multiple checks and longer timeouts
    // First verify AsyncStorage was updated
    await waitFor(
      async () => {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        expect(savedTheme).toBe('light');
      },
      { timeout: 5000 }
    );
    
    // Then wait for the React state to update
    let attempts = 0;
    await waitFor(
      async () => {
        attempts++;
        const currentIsDarkMode = themeResult.current.isDarkMode;
        
        // Periodically give React more time to process state updates
        if (attempts % 5 === 0) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        }
        
        expect(currentIsDarkMode).toBe(false);
      },
      { 
        timeout: 15000, 
        interval: 200,
        onTimeout: (error) => {
          const savedTheme = AsyncStorage.getItem('@app_theme');
          error.message = `ThemeContext did not sync to light mode after ${attempts} attempts. Current isDarkMode: ${themeResult.current.isDarkMode}, currentTheme: ${coinResult.current.currentTheme}, savedTheme: ${savedTheme}`;
          return error;
        }
      }
    );

    // Verify light theme colors
    expect(themeResult.current.colors.background).toBe('#F5F5F5');
    expect(themeResult.current.colors.text).toBe('#1C1C1E');
  });

  it('should persist theme selection', async () => {
    const { result: coinResult } = renderHook(() => useCoins(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(coinResult.current.currentTheme).toBeDefined();
    });

    // Apply theme
    await act(async () => {
      const result = await coinResult.current.applyTheme('default_dark');
      expect(result.success).toBe(true);
    });

    // Verify AsyncStorage was called
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@current_theme',
        'default_dark'
      );
    });
  });

  it('should maintain theme state across context updates', async () => {
    const { result: themeResult } = renderHook(() => useTheme(), {
      wrapper: TestWrapper,
    });

    const { result: coinResult } = renderHook(() => useCoins(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(coinResult.current.currentTheme).toBeDefined();
    });

    // Apply Classic Dark
    await act(async () => {
      const result = await coinResult.current.applyTheme('default_dark');
      expect(result.success).toBe(true);
    });

    // Wait for theme to be applied
    await waitFor(
      () => {
        expect(coinResult.current.currentTheme).toBe('default_dark');
      },
      { timeout: 5000 }
    );

    // Strategy: Wait for ThemeContext to sync with multiple checks and longer timeouts
    // First verify AsyncStorage was updated
    await waitFor(
      async () => {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        expect(savedTheme).toBe('dark');
      },
      { timeout: 5000 }
    );
    
    // Then wait for the React state to update
    let attempts = 0;
    await waitFor(
      async () => {
        attempts++;
        const currentIsDarkMode = themeResult.current.isDarkMode;
        
        // Periodically give React more time to process state updates
        if (attempts % 5 === 0) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        }
        
        expect(currentIsDarkMode).toBe(true);
      },
      { 
        timeout: 15000, 
        interval: 200,
        onTimeout: (error) => {
          const savedTheme = AsyncStorage.getItem('@app_theme');
          error.message = `ThemeContext did not sync to dark mode after ${attempts} attempts. Current isDarkMode: ${themeResult.current.isDarkMode}, currentTheme: ${coinResult.current.currentTheme}, savedTheme: ${savedTheme}`;
          return error;
        }
      }
    );

    // Verify both contexts are in sync
    expect(coinResult.current.currentTheme).toBe('default_dark');
    expect(themeResult.current.isDarkMode).toBe(true);
    expect(themeResult.current.colors.background).toBe('#1C1C1E');
  });
});
