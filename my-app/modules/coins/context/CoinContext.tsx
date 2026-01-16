import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BackgroundTheme, AVAILABLE_THEMES, UserCoins, DEFAULT_USER_COINS, COIN_REWARDS } from '../types/theme';

// API URL 配置
const API_URL = __DEV__
    ? Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000'
    : 'http://your-server-ip:3000';

interface CoinContextType {
    // 货币状态
    balance: number;
    totalEarned: number;
    totalSpent: number;
    loginStreak: number;

    // 主题状态
    ownedThemes: string[];
    currentTheme: string;
    currentThemeData: BackgroundTheme | null;
    availableThemes: BackgroundTheme[];

    // 货币操作
    rewardCoins: (rewardType: keyof typeof COIN_REWARDS, customAmount?: number) => Promise<void>;
    claimDailyLogin: () => Promise<{ success: boolean; reward?: number; streak?: number }>;

    // 主题操作
    buyTheme: (themeId: string) => Promise<{ success: boolean; message: string }>;
    applyTheme: (themeId: string) => Promise<{ success: boolean }>;
    isThemeOwned: (themeId: string) => boolean;

    // 加载状态
    isLoading: boolean;
    refreshCoins: () => Promise<void>;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

const COINS_STORAGE_KEY = '@user_coins';
const THEME_STORAGE_KEY = '@current_theme';

export function CoinProvider({ children }: { children: ReactNode }) {
    const { currentUser, isLoggedIn } = useUser();
    const { toggleDarkMode, isDarkMode } = useTheme();

    // 货币状态
    const [balance, setBalance] = useState(DEFAULT_USER_COINS.balance);
    const [totalEarned, setTotalEarned] = useState(DEFAULT_USER_COINS.totalEarned);
    const [totalSpent, setTotalSpent] = useState(DEFAULT_USER_COINS.totalSpent);
    const [loginStreak, setLoginStreak] = useState(DEFAULT_USER_COINS.loginStreak);

    // 主题状态
    const [ownedThemes, setOwnedThemes] = useState<string[]>(DEFAULT_USER_COINS.ownedThemes);
    const [currentTheme, setCurrentTheme] = useState(DEFAULT_USER_COINS.currentTheme);
    const [availableThemes] = useState<BackgroundTheme[]>(AVAILABLE_THEMES);

    const [isLoading, setIsLoading] = useState(false);

    // 获取当前主题数据
    const currentThemeData = availableThemes.find(t => t.id === currentTheme) || null;

    // 同步主题到 ThemeContext
    const syncThemeWithThemeContext = useCallback(async (themeId: string) => {
        console.log('[CoinContext] syncThemeWithThemeContext called with:', themeId);
        try {
            if (themeId === 'default_dark') {
                // 检查 ThemeContext 的当前状态
                const currentThemeMode = await AsyncStorage.getItem('@app_theme');
                if (currentThemeMode !== 'dark') {
                    console.log('[CoinContext] Syncing ThemeContext to dark mode');
                    await toggleDarkMode();
                    // 确保 ThemeContext 保存了正确的值
                    await AsyncStorage.setItem('@app_theme', 'dark');
                }
            } else if (themeId === 'default_light') {
                // 检查 ThemeContext 的当前状态
                const currentThemeMode = await AsyncStorage.getItem('@app_theme');
                if (currentThemeMode !== 'light') {
                    console.log('[CoinContext] Syncing ThemeContext to light mode');
                    await toggleDarkMode();
                    // 确保 ThemeContext 保存了正确的值
                    await AsyncStorage.setItem('@app_theme', 'light');
                }
            } else {
                // 对于其他主题（渐变主题等），强制使用光明模式
                const currentThemeMode = await AsyncStorage.getItem('@app_theme');
                if (currentThemeMode !== 'light') {
                    console.log('[CoinContext] Non-classic theme detected, forcing light mode');
                    // 如果当前是暗色模式，切换到光明模式
                    if (isDarkMode) {
                        await toggleDarkMode();
                    }
                    // 确保 ThemeContext 保存了正确的值
                    await AsyncStorage.setItem('@app_theme', 'light');
                }
            }
        } catch (error) {
            console.error('[CoinContext] Failed to sync theme with ThemeContext:', error);
        }
    }, [toggleDarkMode, isDarkMode]);

    // 从服务器加载货币数据
    const fetchCoinsFromServer = useCallback(async () => {
        if (!currentUser) return;

        console.log('[CoinContext] fetchCoinsFromServer called for user:', currentUser);

        try {
            const response = await fetch(`${API_URL}/api/coins/${currentUser}`);
            if (response.ok) {
                const data = await response.json();
                console.log('[CoinContext] Server data received:', data);
                console.log('[CoinContext] currentTheme from server:', data.currentTheme);
                console.log('[CoinContext] ownedThemes from server:', data.ownedThemes);

                setBalance(data.balance);
                setTotalEarned(data.totalEarned);
                setTotalSpent(data.totalSpent);
                setOwnedThemes(data.ownedThemes);
                setCurrentTheme(data.currentTheme);
                setLoginStreak(data.loginStreak);

                // 保存到本地存储
                await AsyncStorage.setItem(COINS_STORAGE_KEY, JSON.stringify(data));
                await AsyncStorage.setItem(THEME_STORAGE_KEY, data.currentTheme);
                
                // 同步主题到 ThemeContext
                await syncThemeWithThemeContext(data.currentTheme);
                
                console.log('[CoinContext] Data saved to local storage');
            } else {
                console.log('[CoinContext] Server response not ok:', response.status);
            }
        } catch (error) {
            console.error('[CoinContext] Failed to fetch coins from server:', error);
            // 如果服务器请求失败，尝试从本地加载
            // 注意：loadFromLocal 会在后面定义，这里先不调用，改为在 useEffect 中处理
        }
    }, [currentUser, syncThemeWithThemeContext]);

    // 从本地存储加载
    const loadFromLocal = useCallback(async () => {
        console.log('[CoinContext] loadFromLocal called');
        try {
            const savedData = await AsyncStorage.getItem(COINS_STORAGE_KEY);
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

            console.log('[CoinContext] Local savedData:', savedData);
            console.log('[CoinContext] Local savedTheme:', savedTheme);

            let themeToApply: string | null = null;

            if (savedData) {
                const data = JSON.parse(savedData);
                setBalance(data.balance || DEFAULT_USER_COINS.balance);
                setTotalEarned(data.totalEarned || DEFAULT_USER_COINS.totalEarned);
                setTotalSpent(data.totalSpent || DEFAULT_USER_COINS.totalSpent);
                setOwnedThemes(data.ownedThemes || DEFAULT_USER_COINS.ownedThemes);
                setLoginStreak(data.loginStreak || DEFAULT_USER_COINS.loginStreak);
                // 优先使用 savedData 中的 currentTheme
                if (data.currentTheme) {
                    console.log('[CoinContext] Setting currentTheme from savedData:', data.currentTheme);
                    themeToApply = data.currentTheme;
                }
            }

            // 如果 THEME_STORAGE_KEY 有值，则使用它（因为这是最新应用的主题）
            if (savedTheme) {
                console.log('[CoinContext] Setting currentTheme from THEME_STORAGE_KEY:', savedTheme);
                themeToApply = savedTheme;
            }

            // 应用主题并同步 ThemeContext
            if (themeToApply) {
                setCurrentTheme(themeToApply);
                // 同步 ThemeContext 的 isDarkMode
                await syncThemeWithThemeContext(themeToApply);
            } else {
                // 如果没有保存的主题（未登录用户），应用默认 Classic Light 主题
                setCurrentTheme(DEFAULT_USER_COINS.currentTheme);
                await syncThemeWithThemeContext(DEFAULT_USER_COINS.currentTheme);
            }
        } catch (error) {
            console.error('[CoinContext] Failed to load coins from local:', error);
            // 出错时也应用默认 Classic Light 主题
            setCurrentTheme(DEFAULT_USER_COINS.currentTheme);
            await syncThemeWithThemeContext(DEFAULT_USER_COINS.currentTheme);
        }
    }, [syncThemeWithThemeContext]);

    // 刷新货币数据
    const refreshCoins = useCallback(async () => {
        setIsLoading(true);
        await fetchCoinsFromServer();
        setIsLoading(false);
    }, [fetchCoinsFromServer]);

    // 用户登录时加载数据
    useEffect(() => {
        if (isLoggedIn && currentUser) {
            refreshCoins();
        } else {
            // 用户登出时重置状态，并应用默认 Classic Light 主题
            setBalance(DEFAULT_USER_COINS.balance);
            setTotalEarned(DEFAULT_USER_COINS.totalEarned);
            setTotalSpent(DEFAULT_USER_COINS.totalSpent);
            setOwnedThemes(DEFAULT_USER_COINS.ownedThemes);
            setCurrentTheme(DEFAULT_USER_COINS.currentTheme);
            setLoginStreak(DEFAULT_USER_COINS.loginStreak);
            // 同步应用 Classic Light 主题
            syncThemeWithThemeContext(DEFAULT_USER_COINS.currentTheme);
        }
    }, [isLoggedIn, currentUser, refreshCoins, syncThemeWithThemeContext]);

    // 奖励货币
    const rewardCoins = async (rewardType: keyof typeof COIN_REWARDS, customAmount?: number) => {
        if (!currentUser) return;

        try {
            const response = await fetch(`${API_URL}/api/coins/reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser,
                    rewardType,
                    amount: customAmount,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setBalance(data.balance);
                setTotalEarned(data.totalEarned);
            }
        } catch (error) {
            console.error('Failed to reward coins:', error);
        }
    };

    // 领取每日登录奖励
    const claimDailyLogin = async (): Promise<{ success: boolean; reward?: number; streak?: number }> => {
        if (!currentUser) return { success: false };

        try {
            const response = await fetch(`${API_URL}/api/coins/daily-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setBalance(data.balance);
                    setLoginStreak(data.loginStreak);
                    return {
                        success: true,
                        reward: data.totalReward,
                        streak: data.loginStreak
                    };
                }
                return { success: false };
            }
            return { success: false };
        } catch (error) {
            console.error('Failed to claim daily login:', error);
            return { success: false };
        }
    };

    // 购买主题
    const buyTheme = async (themeId: string): Promise<{ success: boolean; message: string }> => {
        if (!currentUser) return { success: false, message: 'Please login first' };

        const theme = availableThemes.find(t => t.id === themeId);
        if (!theme) return { success: false, message: 'Theme not found' };

        if (ownedThemes.includes(themeId)) {
            return { success: false, message: 'Theme already owned' };
        }

        if (balance < theme.price) {
            return { success: false, message: `Insufficient coins. Need ${theme.price}, have ${balance}` };
        }

        try {
            const response = await fetch(`${API_URL}/api/themes/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, themeId }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setBalance(data.balance);
                setOwnedThemes(data.ownedThemes);
                setTotalSpent(data.totalSpent);
                return { success: true, message: `Successfully purchased ${theme.name}!` };
            }

            return { success: false, message: data.error || 'Purchase failed' };
        } catch (error) {
            console.error('Failed to buy theme:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    };

    // 应用主题
    const applyTheme = async (themeId: string): Promise<{ success: boolean }> => {
        console.log('[CoinContext] applyTheme called with:', themeId);
        console.log('[CoinContext] Current ownedThemes:', ownedThemes);

        if (!ownedThemes.includes(themeId)) {
            console.log('[CoinContext] Theme not owned, returning false');
            return { success: false };
        }

        // 先在本地应用
        setCurrentTheme(themeId);

        // 同步主题到 ThemeContext
        await syncThemeWithThemeContext(themeId);

        // 保存到本地存储（两个位置都保存，确保数据一致性）
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
        
        // 同时更新 @app_theme 以确保 ThemeContext 能正确读取
        if (themeId === 'default_dark') {
            await AsyncStorage.setItem('@app_theme', 'dark');
        } else if (themeId === 'default_light') {
            await AsyncStorage.setItem('@app_theme', 'light');
        }

        // 同时更新 COINS_STORAGE_KEY 中的 currentTheme
        try {
            const savedData = await AsyncStorage.getItem(COINS_STORAGE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                data.currentTheme = themeId;
                await AsyncStorage.setItem(COINS_STORAGE_KEY, JSON.stringify(data));
            }
        } catch (error) {
            console.error('[CoinContext] Failed to update currentTheme in COINS_STORAGE:', error);
        }

        console.log('[CoinContext] Theme applied locally:', themeId);

        // 同步到服务器
        if (currentUser) {
            try {
                const response = await fetch(`${API_URL}/api/themes/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUser, themeId }),
                });
                const result = await response.json();
                console.log('[CoinContext] Server response for applyTheme:', result);
            } catch (error) {
                console.error('[CoinContext] Failed to sync theme to server:', error);
            }
        }

        return { success: true };
    };

    // 检查主题是否已拥有
    const isThemeOwned = (themeId: string): boolean => {
        return ownedThemes.includes(themeId);
    };

    return (
        <CoinContext.Provider
            value={{
                balance,
                totalEarned,
                totalSpent,
                loginStreak,
                ownedThemes,
                currentTheme,
                currentThemeData,
                availableThemes,
                rewardCoins,
                claimDailyLogin,
                buyTheme,
                applyTheme,
                isThemeOwned,
                isLoading,
                refreshCoins,
            }}
        >
            {children}
        </CoinContext.Provider>
    );
}

export function useCoins() {
    const context = useContext(CoinContext);
    if (context === undefined) {
        throw new Error('useCoins must be used within a CoinProvider');
    }
    return context;
}
