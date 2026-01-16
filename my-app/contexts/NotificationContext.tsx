// NotificationContext - Notification System Management
// Provides local notifications: task reminders, daily check-ins, focus completion

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';
import { useLanguage } from './LanguageContext';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Notification Types
export type NotificationType =
    | 'task_reminder'      // 任务提醒
    | 'daily_checkin'      // 每日签到提醒
    | 'focus_complete'     // 专注完成通知
    | 'achievement'        // 成就通知
    | 'coin_reward';       // 金币奖励通知

interface ScheduledNotification {
    id: string;
    type: NotificationType;
    taskId?: string;
    scheduledTime: Date;
}

interface NotificationSettings {
    enabled: boolean;
    taskReminders: boolean;
    dailyCheckin: boolean;
    dailyCheckinTime: string; // HH:mm 格式
    focusComplete: boolean;
    achievements: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: true,
    taskReminders: true,
    dailyCheckin: true,
    dailyCheckinTime: '09:00',
    focusComplete: true,
    achievements: true,
};

interface NotificationContextType {
    // 权限状态
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;

    // 设置
    settings: NotificationSettings;
    updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;

    // 即时通知
    showLocalNotification: (title: string, body: string, type: NotificationType) => Promise<void>;

    // 任务提醒
    scheduleTaskReminder: (taskId: string, taskName: string, reminderTime: Date) => Promise<string | null>;
    cancelTaskReminder: (taskId: string) => Promise<void>;

    // 每日签到提醒
    scheduleDailyCheckinReminder: () => Promise<void>;
    cancelDailyCheckinReminder: () => Promise<void>;

    // 专注完成通知
    showFocusCompleteNotification: (taskName: string, duration: number) => Promise<void>;

    // 成就/奖励通知
    showAchievementNotification: (title: string, message: string) => Promise<void>;
    showCoinRewardNotification: (amount: number, reason: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SETTINGS_KEY = '@notification_settings';
const SCHEDULED_NOTIFICATIONS_KEY = '@scheduled_notifications';
const DAILY_CHECKIN_NOTIFICATION_ID = 'daily_checkin_reminder';

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn, currentUser } = useUser();
    const { language } = useLanguage();
    const [hasPermission, setHasPermission] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
    const notificationListener = useRef<Notifications.EventSubscription>(undefined);
    const responseListener = useRef<Notifications.EventSubscription>(undefined);

    // Initialization
    useEffect(() => {
        loadSettings();
        checkPermission();
        setupNotificationListeners();

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    // Schedule daily check-in reminder after login
    useEffect(() => {
        if (isLoggedIn && settings.enabled && settings.dailyCheckin) {
            scheduleDailyCheckinReminder();
        }
    }, [isLoggedIn, settings.enabled, settings.dailyCheckin]);

    // Setup notification listeners
    const setupNotificationListeners = () => {
        // Notification received
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });

        // Notification response received
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
            // 这里可以添加导航逻辑
        });
    };

    // Load settings
    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }

            const savedNotifications = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
            if (savedNotifications) {
                setScheduledNotifications(JSON.parse(savedNotifications));
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    };

    // Save settings
    const saveSettings = async (newSettings: NotificationSettings) => {
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Failed to save notification settings:', error);
        }
    };

    // Check permissions
    const checkPermission = async () => {
        if (!Device.isDevice) {
            // 在模拟器上也允许测试
            setHasPermission(true);
            return;
        }

        const { status } = await Notifications.getPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    // Request permissions
    const requestPermission = async (): Promise<boolean> => {
        if (!Device.isDevice) {
            setHasPermission(true);
            return true;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert(
                language === 'zh' ? '通知权限' : 'Notification Permission',
                language === 'zh'
                    ? '请在设置中开启通知权限以接收提醒'
                    : 'Please enable notifications in settings to receive reminders'
            );
            setHasPermission(false);
            return false;
        }

        setHasPermission(true);

        // Android channel config
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#007AFF',
            });
        }

        return true;
    };

    // Update settings
    const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        await saveSettings(updated);

        // Update daily check-in based on settings
        if (newSettings.dailyCheckin !== undefined || newSettings.dailyCheckinTime !== undefined) {
            if (updated.enabled && updated.dailyCheckin) {
                await scheduleDailyCheckinReminder();
            } else {
                await cancelDailyCheckinReminder();
            }
        }
    };

    // Show immediate local notification
    const showLocalNotification = async (title: string, body: string, type: NotificationType) => {
        if (!settings.enabled) return;

        // Check if specific type is enabled
        if (type === 'task_reminder' && !settings.taskReminders) return;
        if (type === 'daily_checkin' && !settings.dailyCheckin) return;
        if (type === 'focus_complete' && !settings.focusComplete) return;
        if ((type === 'achievement' || type === 'coin_reward') && !settings.achievements) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null, // 立即显示
        });
    };

    // Schedule task reminder
    const scheduleTaskReminder = async (
        taskId: string,
        taskName: string,
        reminderTime: Date
    ): Promise<string | null> => {
        if (!settings.enabled || !settings.taskReminders) return null;

        // Cancel previous reminder
        await cancelTaskReminder(taskId);

        // Check if date is in the future
        if (reminderTime.getTime() <= Date.now()) {
            return null;
        }

        const title = language === 'zh' ? '任务提醒' : 'Task Reminder';
        const body = language === 'zh'
            ? `该完成任务了：${taskName}`
            : `Time to complete: ${taskName}`;

        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    data: { type: 'task_reminder', taskId },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: reminderTime,
                },
            });

            // Save to scheduled notifications
            const newScheduled: ScheduledNotification = {
                id: notificationId,
                type: 'task_reminder',
                taskId,
                scheduledTime: reminderTime,
            };
            const updated = [...scheduledNotifications, newScheduled];
            setScheduledNotifications(updated);
            await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(updated));

            return notificationId;
        } catch (error) {
            console.error('Failed to schedule task reminder:', error);
            return null;
        }
    };

    // Cancel task reminder
    const cancelTaskReminder = async (taskId: string) => {
        const notification = scheduledNotifications.find(n => n.taskId === taskId);
        if (notification) {
            await Notifications.cancelScheduledNotificationAsync(notification.id);
            const updated = scheduledNotifications.filter(n => n.taskId !== taskId);
            setScheduledNotifications(updated);
            await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(updated));
        }
    };

    // Schedule daily check-in reminder
    const scheduleDailyCheckinReminder = async () => {
        if (!settings.enabled || !settings.dailyCheckin) return;

        // Cancel previous reminder
        await cancelDailyCheckinReminder();

        const [hours, minutes] = settings.dailyCheckinTime.split(':').map(Number);

        const title = language === 'zh' ? '每日签到' : 'Daily Check-in';
        const body = language === 'zh'
            ? '别忘了签到领取金币！'
            : "Don't forget to check in and earn coins!";

        try {
            await Notifications.scheduleNotificationAsync({
                identifier: DAILY_CHECKIN_NOTIFICATION_ID,
                content: {
                    title,
                    body,
                    sound: true,
                    data: { type: 'daily_checkin' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: hours,
                    minute: minutes,
                },
            });
        } catch (error) {
            console.error('Failed to schedule daily checkin reminder:', error);
        }
    };

    // Cancel daily check-in reminder
    const cancelDailyCheckinReminder = async () => {
        try {
            await Notifications.cancelScheduledNotificationAsync(DAILY_CHECKIN_NOTIFICATION_ID);
        } catch (error) {
            // 可能不存在，忽略错误
        }
    };

    // Show focus completion notification
    const showFocusCompleteNotification = async (taskName: string, duration: number) => {
        if (!settings.enabled || !settings.focusComplete) return;

        const title = language === 'zh' ? '🎉 专注完成！' : '🎉 Focus Complete!';
        const durationStr = duration < 1
            ? `${Math.round(duration * 60)}${language === 'zh' ? '秒' : 's'}`
            : `${duration}${language === 'zh' ? '分钟' : ' min'}`;
        const body = language === 'zh'
            ? `恭喜！你专注了 ${durationStr} 完成了 "${taskName}"`
            : `Congrats! You focused for ${durationStr} on "${taskName}"`;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null,
        });
    };

    // Show achievement notification
    const showAchievementNotification = async (title: string, message: string) => {
        if (!settings.enabled || !settings.achievements) return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `🏆 ${title}`,
                body: message,
                sound: true,
            },
            trigger: null,
        });
    };

    // Show coin reward notification
    const showCoinRewardNotification = async (amount: number, reason: string) => {
        if (!settings.enabled || !settings.achievements) return;

        const title = language === 'zh' ? '💰 获得金币！' : '💰 Coins Earned!';
        const body = language === 'zh'
            ? `+${amount} 金币 - ${reason}`
            : `+${amount} coins - ${reason}`;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null,
        });
    };

    return (
        <NotificationContext.Provider
            value={{
                hasPermission,
                requestPermission,
                settings,
                updateSettings,
                showLocalNotification,
                scheduleTaskReminder,
                cancelTaskReminder,
                scheduleDailyCheckinReminder,
                cancelDailyCheckinReminder,
                showFocusCompleteNotification,
                showAchievementNotification,
                showCoinRewardNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
