// jest.setup.js - Jest 测试环境配置
// Note: Global mocks for Expo Winter are in jest.preset.js which runs first

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
    cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    AndroidImportance: {
        MAX: 5,
        HIGH: 4,
        DEFAULT: 3,
        LOW: 2,
        MIN: 1,
    },
    SchedulableTriggerInputTypes: {
        DATE: 'date',
        DAILY: 'daily',
    },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
    isDevice: true,
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: 'LinearGradient',
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
        replace: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    Link: 'Link',
    Stack: ({ children }: { children: React.ReactNode }) => children,
    Tabs: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn(() => Promise.resolve()),
    hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
    StatusBar: 'StatusBar',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

// Console mock removed to see errors
