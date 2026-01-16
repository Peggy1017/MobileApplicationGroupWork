import React from 'react';
import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import ThemedBackground from '../components/ThemedBackground';

// Mock dependencies
jest.mock('../contexts/CoinContext', () => ({
    useCoins: jest.fn(),
}));

jest.mock('../contexts/ThemeContext', () => ({
    useTheme: jest.fn(),
}));

import { useCoins } from '../contexts/CoinContext';
import { useTheme } from '../contexts/ThemeContext';

describe('ThemedBackground', () => {
    beforeEach(() => {
        // Default mocks
        (useTheme as jest.Mock).mockReturnValue({
            colors: { background: '#ffffff' },
            isDarkMode: false,
        });
    });

    it('renders children correctly', () => {
        (useCoins as jest.Mock).mockReturnValue({
            currentThemeData: null,
        });

        const { getByText } = render(
            <ThemedBackground>
                <Text>Test Content</Text>
            </ThemedBackground>
        );

        expect(getByText('Test Content')).toBeTruthy();
    });

    it('renders default background when no theme is selected', () => {
        (useCoins as jest.Mock).mockReturnValue({
            currentThemeData: null,
        });

        const { toJSON } = render(
            <ThemedBackground>
                <View />
            </ThemedBackground>
        );

        expect(toJSON()).toMatchSnapshot();
    });

    it('renders gradient background when gradient theme is selected', () => {
        (useCoins as jest.Mock).mockReturnValue({
            currentThemeData: {
                id: 'sunset',
                type: 'gradient',
                colors: ['#ff9966', '#ff5e62'],
            },
        });

        const { toJSON } = render(
            <ThemedBackground>
                <View />
            </ThemedBackground>
        );

        expect(toJSON()).toMatchSnapshot();
    });

    it('renders solid background when solid theme is selected', () => {
        (useCoins as jest.Mock).mockReturnValue({
            currentThemeData: {
                id: 'ocean',
                type: 'solid',
                colors: ['#007AFF'],
            },
        });

        const { toJSON } = render(
            <ThemedBackground>
                <View />
            </ThemedBackground>
        );

        expect(toJSON()).toMatchSnapshot();
    });
});
