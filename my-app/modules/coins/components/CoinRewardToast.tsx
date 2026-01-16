import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CoinRewardToastProps {
    visible: boolean;
    amount: number;
    message?: string;
    onHide: () => void;
}

export default function CoinRewardToast({ visible, amount, message, onHide }: CoinRewardToastProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    const onHideRef = useRef(onHide);

    // 更新 ref 以保持最新的 onHide 回调
    useEffect(() => {
        onHideRef.current = onHide;
    }, [onHide]);

    useEffect(() => {
        if (visible) {
            // 重置动画值
            fadeAnim.setValue(0);
            translateY.setValue(50);

            // 显示动画
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // 2秒后自动隐藏
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -50,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    onHideRef.current();
                });
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [visible, fadeAnim, translateY]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
                    <Text style={styles.plusSign}>+</Text>
                </View>
                <Text style={styles.amount}>{amount}</Text>
                {message && <Text style={styles.message}>{message}</Text>}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        gap: 8,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    plusSign: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34C759',
        marginLeft: 2,
    },
    amount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    message: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 8,
    },
});
