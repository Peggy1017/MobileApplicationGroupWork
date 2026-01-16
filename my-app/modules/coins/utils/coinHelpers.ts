// 货币相关工具函数

import { COIN_REWARDS } from '../types/theme';

/**
 * 格式化金币数量显示
 */
export function formatCoinAmount(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
}

/**
 * 计算连续登录奖励
 */
export function calculateStreakReward(streak: number): number {
    const baseReward = COIN_REWARDS.DAILY_LOGIN;
    const streakBonus = Math.min(streak - 1, 7) * COIN_REWARDS.STREAK_BONUS;
    return baseReward + streakBonus;
}

/**
 * 获取奖励类型的显示名称
 */
export function getRewardTypeName(rewardType: keyof typeof COIN_REWARDS, language: 'en' | 'zh' = 'en'): string {
    const names = {
        en: {
            TASK_COMPLETE: 'Task Complete',
            FOCUS_SESSION: 'Focus Session',
            DAILY_LOGIN: 'Daily Login',
            STREAK_BONUS: 'Streak Bonus',
            FIRST_TASK_OF_DAY: 'First Task of Day',
        },
        zh: {
            TASK_COMPLETE: '完成任务',
            FOCUS_SESSION: '完成专注',
            DAILY_LOGIN: '每日登录',
            STREAK_BONUS: '连续登录奖励',
            FIRST_TASK_OF_DAY: '今日首个任务',
        },
    };
    return names[language][rewardType] || rewardType;
}

/**
 * 检查今天是否已签到
 */
export function isToday(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    const today = new Date().toDateString();
    return dateString === today;
}
