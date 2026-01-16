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

// Note: ThemeProvider must wrap CoinProvider because CoinProvider uses useTheme
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>
    <ThemeProvider>
      <CoinProvider>{children}</CoinProvider>
    </ThemeProvider>
  </UserProvider>
);

describe('Theme Integration Tests', () => {
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

  it('should sync ThemeContext when Classic Dark theme is applied', async () => {
    const { result: themeResult } = renderHook(() => useTheme(), {
      wrapper: TestWrapper,
    });

    const { result: coinResult } = renderHook(() => useCoins(), {
      wrapper: TestWrapper,
    });

    await waitFor(() => {
      expect(coinResult.current.currentTheme).toBeDefined();
    });

    // Initially should be light mode
    expect(themeResult.current.isDarkMode).toBe(false);

    // Apply Classic Dark theme
    await act(async () => {
      const result = await coinResult.current.applyTheme('default_dark');
      expect(result.success).toBe(true);
    });

    // Wait for theme to be applied in CoinContext first
    await waitFor(
      () => {
        expect(coinResult.current.currentTheme).toBe('default_dark');
      },
      { timeout: 5000 }
    );

    // Strategy: Wait for ThemeContext to sync with multiple checks and longer timeouts
    // toggleDarkMode is called inside applyTheme, but React state updates are batched
    // We need to wait for the state update to propagate through the component tree
    // Also check AsyncStorage to ensure the theme was saved
    let attempts = 0;
    
    // First, verify AsyncStorage was updated (this confirms toggleDarkMode was called)
    await waitFor(
      async () => {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        expect(savedTheme).toBe('dark');
      },
      { timeout: 5000 }
    );
    
    // Then wait for the React state to update
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

    // Colors should be dark theme colors
    expect(themeResult.current.colors.background).toBe('#1C1C1E');
    expect(themeResult.current.colors.text).toBe('#FFFFFF');
  }, 15000);

  it('should sync ThemeContext when Classic Light theme is applied', async () => {
    // First set to dark mode
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

    await waitFor(
      () => {
        expect(themeResult.current.isDarkMode).toBe(true);
      },
      { timeout: 3000 }
    );

    // Apply Classic Light theme
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

    // Wait for AsyncStorage to be updated
    await waitFor(
      async () => {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        expect(savedTheme).toBe('light');
      },
      { timeout: 5000 }
    );
    
    // Give React multiple opportunities to update state
    let attempts = 0;
    await waitFor(
      async () => {
        attempts++;
        
        if (attempts % 3 === 0) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          });
        }
        
        const currentIsDarkMode = themeResult.current.isDarkMode;
        const savedTheme = mockStorage['@app_theme'];
        
        if (savedTheme === 'light' && currentIsDarkMode) {
          themeResult.current.isDarkMode;
          throw new Error(`State not synced yet. Attempt ${attempts}`);
        }
        
        expect(currentIsDarkMode).toBe(false);
      },
      { 
        timeout: 15000, 
        interval: 500,
        onTimeout: (error) => {
          const savedTheme = mockStorage['@app_theme'];
          error.message = `ThemeContext did not sync to light mode after ${attempts} attempts. Current isDarkMode: ${themeResult.current.isDarkMode}, currentTheme: ${coinResult.current.currentTheme}, savedTheme: ${savedTheme}`;
          return error;
        }
      }
    );

    // Colors should be light theme colors
    expect(themeResult.current.colors.background).toBe('#F5F5F5');
    expect(themeResult.current.colors.text).toBe('#1C1C1E');
  }, 15000);

  it('should maintain theme consistency across contexts', async () => {
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

    // Wait for AsyncStorage to be updated
    await waitFor(
      async () => {
        const savedTheme = await AsyncStorage.getItem('@app_theme');
        expect(savedTheme).toBe('dark');
      },
      { timeout: 5000 }
    );
    
    // Give React time to process the state update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });
    
    // Then wait for the React state to update
    let attempts = 0;
    await waitFor(
      async () => {
        attempts++;
        const currentIsDarkMode = themeResult.current.isDarkMode;
        
        // Periodically give React more time to process state updates
        if (attempts % 5 === 0) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          });
        }
        
        expect(currentIsDarkMode).toBe(true);
      },
      { 
        timeout: 15000, 
        interval: 200,
        onTimeout: (error) => {
          const savedTheme = mockStorage['@app_theme'];
          error.message = `ThemeContext did not sync to dark mode after ${attempts} attempts. Current isDarkMode: ${themeResult.current.isDarkMode}, currentTheme: ${coinResult.current.currentTheme}, savedTheme: ${savedTheme}`;
          return error;
        }
      }
    );

    // Verify colors match
    const darkTheme = coinResult.current.currentThemeData;
    expect(darkTheme?.id).toBe('default_dark');
    expect(themeResult.current.colors.background).toBe('#1C1C1E');
  }, 20000);
});
