// ThemedBackground - Component for themed application backgrounds
// Displays background based on user's purchased/applied theme

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoins } from '@/contexts/CoinContext';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedBackgroundProps {
    children: ReactNode;
    style?: ViewStyle;
    // Whether to use custom theme background, default is true
    useCustomTheme?: boolean;
}

export default function ThemedBackground({
    children,
    style,
    useCustomTheme = true
}: ThemedBackgroundProps) {
    const { currentThemeData } = useCoins();
    const { colors } = useTheme();

    // Use default background if no custom theme or no theme data
    if (!useCustomTheme || !currentThemeData) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, style]}>
                {children}
            </View>
        );
    }

    // Check if it is the default theme
    if (currentThemeData.isDefault) {
        // Default theme uses its own defined colors (not system dark/light mode)
        // This allows Classic Dark to use #303030 and Classic Light to use #F5F5F5
        if (currentThemeData.type === 'solid' && currentThemeData.colors.length > 0) {
            return (
                <View style={[styles.container, { backgroundColor: currentThemeData.colors[0] }, style]}>
                    {children}
                </View>
            );
        }
        // Fallback to ThemeContext colors if no color defined
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, style]}>
                {children}
            </View>
        );
    }

    // Gradient theme
    if (currentThemeData.type === 'gradient' && currentThemeData.colors.length >= 2) {
        return (
            <LinearGradient
                colors={currentThemeData.colors as [string, string, ...string[]]}
                style={[styles.container, style]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {children}
            </LinearGradient>
        );
    }

    // Solid color theme
    if (currentThemeData.type === 'solid' && currentThemeData.colors.length > 0) {
        return (
            <View style={[styles.container, { backgroundColor: currentThemeData.colors[0] }, style]}>
                {children}
            </View>
        );
    }

    // Default fallback
    return (
        <View style={[styles.container, { backgroundColor: colors.background }, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
