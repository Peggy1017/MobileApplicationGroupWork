import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoins } from '../context/CoinContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import { BackgroundTheme } from '../types/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ShopScreen() {
    const router = useRouter();
    const { isLoggedIn } = useUser();
    const { colors } = useTheme();
    const { language } = useLanguage();
    const {
        balance,
        totalEarned,
        loginStreak,
        availableThemes,
        currentTheme,
        ownedThemes,
        buyTheme,
        applyTheme,
        isThemeOwned,
        claimDailyLogin,
        refreshCoins,
    } = useCoins();

    const [selectedTheme, setSelectedTheme] = useState<BackgroundTheme | null>(null);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [coinAnimValue] = useState(new Animated.Value(0));

    // 每日登录奖励动画
    const animateCoinReward = () => {
        setShowCoinAnimation(true);
        Animated.sequence([
            Animated.timing(coinAnimValue, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.delay(1000),
            Animated.timing(coinAnimValue, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setShowCoinAnimation(false));
    };

    // 领取每日奖励
    const handleClaimDaily = async () => {
        const result = await claimDailyLogin();
        if (result.success) {
            setDailyRewardClaimed(true);
            animateCoinReward();
            Alert.alert(
                '🎉 ' + (language === 'zh' ? '每日奖励' : 'Daily Reward'),
                language === 'zh'
                    ? `获得 ${result.reward} 金币！\n连续登录 ${result.streak} 天`
                    : `You got ${result.reward} coins!\n${result.streak} day streak`,
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert(
                language === 'zh' ? '提示' : 'Notice',
                language === 'zh' ? '今日奖励已领取' : 'Already claimed today',
                [{ text: 'OK' }]
            );
        }
    };

    // 购买主题处理
    const handleBuyTheme = async (theme: BackgroundTheme) => {
        if (isThemeOwned(theme.id)) {
            // 已拥有，直接应用
            const result = await applyTheme(theme.id);
            if (result.success) {
                setPreviewModalVisible(false);
                Alert.alert(
                    '✨ ' + (language === 'zh' ? '成功' : 'Success'),
                    language === 'zh' ? `已应用 "${theme.nameZh}" 主题` : `Applied "${theme.name}" theme`,
                    [{ text: 'OK' }]
                );
            }
        } else {
            // 未拥有，购买
            Alert.alert(
                language === 'zh' ? '确认购买' : 'Confirm Purchase',
                language === 'zh'
                    ? `是否花费 ${theme.price} 金币购买 "${theme.nameZh}"？`
                    : `Spend ${theme.price} coins on "${theme.name}"?`,
                [
                    { text: language === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
                    {
                        text: language === 'zh' ? '购买' : 'Buy',
                        onPress: async () => {
                            const result = await buyTheme(theme.id);
                            if (result.success) {
                                Alert.alert('🎉 ' + (language === 'zh' ? '购买成功' : 'Success'), result.message);
                                refreshCoins();
                            } else {
                                Alert.alert(language === 'zh' ? '购买失败' : 'Failed', result.message);
                            }
                        },
                    },
                ]
            );
        }
    };

    // 渲染主题卡片
    const renderThemeCard = (theme: BackgroundTheme) => {
        const owned = isThemeOwned(theme.id);
        const isCurrent = currentTheme === theme.id;
        const canAfford = balance >= theme.price;

        return (
            <TouchableOpacity
                key={theme.id}
                style={[styles.themeCard, { backgroundColor: colors.surface }]}
                onPress={() => {
                    setSelectedTheme(theme);
                    setPreviewModalVisible(true);
                }}
                activeOpacity={0.8}
            >
                {/* 主题预览 */}
                <View style={styles.themePreview}>
                    {theme.type === 'gradient' ? (
                        <LinearGradient
                            colors={theme.colors as [string, string, ...string[]]}
                            style={styles.gradientPreview}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    ) : (
                        <View style={[styles.solidPreview, { backgroundColor: theme.colors[0] }]} />
                    )}

                    {/* 状态标签 */}
                    {isCurrent && (
                        <View style={[styles.statusBadge, styles.currentBadge]}>
                            <Ionicons name="checkmark-circle" size={12} color="#fff" />
                            <Text style={styles.badgeText}>{language === 'zh' ? '使用中' : 'Active'}</Text>
                        </View>
                    )}
                    {owned && !isCurrent && (
                        <View style={[styles.statusBadge, styles.ownedBadge]}>
                            <Text style={styles.badgeText}>{language === 'zh' ? '已拥有' : 'Owned'}</Text>
                        </View>
                    )}
                </View>

                {/* 主题信息 */}
                <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: colors.text }]} numberOfLines={1}>
                        {language === 'zh' ? theme.nameZh : theme.name}
                    </Text>

                    {theme.isDefault ? (
                        <Text style={[styles.freeLabel, { color: '#34C759' }]}>
                            {language === 'zh' ? '免费' : 'FREE'}
                        </Text>
                    ) : owned ? (
                        <TouchableOpacity
                            style={[styles.applyBtn, isCurrent && styles.applyBtnDisabled]}
                            onPress={() => handleBuyTheme(theme)}
                            disabled={isCurrent}
                        >
                            <Text style={styles.applyBtnText}>
                                {isCurrent
                                    ? (language === 'zh' ? '使用中' : 'Active')
                                    : (language === 'zh' ? '应用' : 'Apply')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.priceContainer}>
                            <Ionicons name="logo-bitcoin" size={14} color="#FFD700" />
                            <Text style={[styles.priceText, !canAfford && styles.priceTextRed]}>
                                {theme.price}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (!isLoggedIn) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.notLoggedIn}>
                    <Ionicons name="lock-closed-outline" size={60} color={colors.textSecondary} />
                    <Text style={[styles.notLoggedInText, { color: colors.text }]}>
                        {language === 'zh' ? '请先登录' : 'Please login first'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/(tabs)/profile')}
                    >
                        <Text style={styles.loginBtnText}>
                            {language === 'zh' ? '去登录' : 'Login'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* 头部 */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {language === 'zh' ? '主题商店' : 'Theme Shop'}
                </Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 余额卡片 */}
                <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.balanceCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.balanceLeft}>
                        <Text style={styles.balanceLabel}>
                            {language === 'zh' ? '我的金币' : 'My Coins'}
                        </Text>
                        <View style={styles.balanceRow}>
                            <Ionicons name="logo-bitcoin" size={28} color="#fff" />
                            <Text style={styles.balanceValue}>{balance}</Text>
                        </View>
                        <Text style={styles.balanceStats}>
                            {language === 'zh'
                                ? `累计获得: ${totalEarned} | 连续登录: ${loginStreak}天`
                                : `Total earned: ${totalEarned} | Streak: ${loginStreak} days`}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.dailyRewardBtn, dailyRewardClaimed && styles.dailyRewardBtnClaimed]}
                        onPress={handleClaimDaily}
                    >
                        <Ionicons name="gift" size={20} color={dailyRewardClaimed ? '#999' : '#FFD700'} />
                        <Text style={[styles.dailyRewardText, dailyRewardClaimed && styles.dailyRewardTextClaimed]}>
                            {language === 'zh' ? '每日签到' : 'Daily'}
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* 如何获得金币 */}
                <View style={[styles.howToEarn, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {language === 'zh' ? '💰 如何获得金币' : '💰 How to Earn'}
                    </Text>
                    <View style={styles.earnList}>
                        <View style={styles.earnItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                            <Text style={[styles.earnText, { color: colors.text }]}>
                                {language === 'zh' ? '完成任务 +5' : 'Complete task +5'}
                            </Text>
                        </View>
                        <View style={styles.earnItem}>
                            <Ionicons name="time" size={18} color="#007AFF" />
                            <Text style={[styles.earnText, { color: colors.text }]}>
                                {language === 'zh' ? '完成专注 +10' : 'Focus session +10'}
                            </Text>
                        </View>
                        <View style={styles.earnItem}>
                            <Ionicons name="calendar" size={18} color="#FF9500" />
                            <Text style={[styles.earnText, { color: colors.text }]}>
                                {language === 'zh' ? '每日签到 +3~17' : 'Daily login +3~17'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 主题列表 */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                    {language === 'zh' ? '🎨 背景主题' : '🎨 Background Themes'}
                </Text>

                <View style={styles.themesGrid}>
                    {availableThemes.map(renderThemeCard)}
                </View>
            </ScrollView>

            {/* 主题预览 Modal */}
            <Modal
                visible={previewModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.previewModal, { backgroundColor: colors.surface }]}>
                        {selectedTheme && (
                            <>
                                {/* 大预览 */}
                                <View style={styles.previewLarge}>
                                    {selectedTheme.type === 'gradient' ? (
                                        <LinearGradient
                                            colors={selectedTheme.colors as [string, string, ...string[]]}
                                            style={styles.previewLargeGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    ) : (
                                        <View style={[styles.previewLargeSolid, { backgroundColor: selectedTheme.colors[0] }]} />
                                    )}
                                </View>

                                {/* 主题信息 */}
                                <Text style={[styles.previewTitle, { color: colors.text }]}>
                                    {language === 'zh' ? selectedTheme.nameZh : selectedTheme.name}
                                </Text>
                                <Text style={[styles.previewDesc, { color: colors.textSecondary }]}>
                                    {language === 'zh' ? selectedTheme.descriptionZh : selectedTheme.description}
                                </Text>

                                {/* 按钮 */}
                                <View style={styles.previewButtons}>
                                    <TouchableOpacity
                                        style={[styles.previewBtn, styles.previewBtnCancel, { borderColor: colors.border }]}
                                        onPress={() => setPreviewModalVisible(false)}
                                    >
                                        <Text style={[styles.previewBtnText, { color: colors.text }]}>
                                            {language === 'zh' ? '关闭' : 'Close'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.previewBtn,
                                            styles.previewBtnAction,
                                            { backgroundColor: isThemeOwned(selectedTheme.id) ? '#34C759' : colors.primary },
                                            currentTheme === selectedTheme.id && { backgroundColor: '#999' }
                                        ]}
                                        onPress={() => handleBuyTheme(selectedTheme)}
                                        disabled={currentTheme === selectedTheme.id}
                                    >
                                        {isThemeOwned(selectedTheme.id) ? (
                                            <Text style={styles.previewBtnTextWhite}>
                                                {currentTheme === selectedTheme.id
                                                    ? (language === 'zh' ? '使用中' : 'Active')
                                                    : (language === 'zh' ? '应用' : 'Apply')}
                                            </Text>
                                        ) : (
                                            <View style={styles.priceRow}>
                                                <Ionicons name="logo-bitcoin" size={16} color="#fff" />
                                                <Text style={styles.previewBtnTextWhite}>{selectedTheme.price}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* 金币动画 */}
            {showCoinAnimation && (
                <Animated.View
                    style={[
                        styles.coinAnimation,
                        {
                            opacity: coinAnimValue,
                            transform: [
                                {
                                    translateY: coinAnimValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -50],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Ionicons name="logo-bitcoin" size={40} color="#FFD700" />
                    <Text style={styles.coinAnimText}>+</Text>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    placeholder: {
        width: 32,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    balanceCard: {
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    balanceLeft: {
        flex: 1,
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    balanceStats: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 8,
    },
    dailyRewardBtn: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },
    dailyRewardBtnClaimed: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dailyRewardText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    dailyRewardTextClaimed: {
        color: '#999',
    },
    howToEarn: {
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    earnList: {
        gap: 10,
    },
    earnItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    earnText: {
        fontSize: 14,
    },
    themesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginTop: 12,
    },
    themeCard: {
        width: CARD_WIDTH,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    themePreview: {
        height: 100,
        position: 'relative',
    },
    gradientPreview: {
        flex: 1,
    },
    solidPreview: {
        flex: 1,
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    currentBadge: {
        backgroundColor: '#34C759',
    },
    ownedBadge: {
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    themeInfo: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    themeName: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    freeLabel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFD700',
    },
    priceTextRed: {
        color: '#FF3B30',
    },
    applyBtn: {
        backgroundColor: '#34C759',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    applyBtnDisabled: {
        backgroundColor: '#999',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    notLoggedIn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    notLoggedInText: {
        fontSize: 18,
        fontWeight: '500',
    },
    loginBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    previewModal: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    previewLarge: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    previewLargeGradient: {
        flex: 1,
    },
    previewLargeSolid: {
        flex: 1,
    },
    previewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    previewDesc: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    previewButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    previewBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewBtnCancel: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    previewBtnAction: {
        // dynamic color
    },
    previewBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
    previewBtnTextWhite: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    coinAnimation: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -30,
        marginTop: -30,
        flexDirection: 'row',
        alignItems: 'center',
    },
    coinAnimText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
    },
});
