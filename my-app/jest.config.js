module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
    ],
    // Use setupFiles to run BEFORE imports - order matters!
    setupFiles: ['<rootDir>/jest.preset.js', '<rootDir>/jest.setup.js'],
    setupFilesAfterEnv: [],
    testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'contexts/**/*.{js,jsx,ts,tsx}',
        'modules/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        // Mock Expo Winter runtime files to prevent scope errors
        '^expo/src/winter/runtime.native$': '<rootDir>/__tests__/expo-winter-fix.js',
        '^expo/src/winter/installGlobal$': '<rootDir>/__tests__/expo-winter-fix.js',
    },
    // Use jsdom environment for React Native tests
    testEnvironment: 'jsdom',
    globals: {
        __DEV__: true,
    },
    // Increase test timeout for integration tests (especially theme sync tests)
    testTimeout: 20000,
};
