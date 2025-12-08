import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

const translations = {
  en: {
    'settings': 'Settings',
    'notifications': 'Notifications',
    'enable_push_notifications': 'Enable push notifications',
    'dark_mode': 'Dark Mode',
    'switch_to_dark_theme': 'Switch to dark theme',
    'language': 'Language',
    'help_support': 'Help & Support',
    'get_help': 'Get help and contact support',
    'about': 'About',
    'app_version': 'App version 1.0.0',
    'tag_management': 'Tag Management',
    'add_new_tag': 'Add New Tag',
    'edit_tag': 'Edit Tag',
    'logout': 'Logout',
    'today': 'Today',
    'data': 'Data',
    'profile': 'Profile',
    'total_tasks': 'Total Tasks',
    'completed': 'Completed',
    'pending': 'Pending',
    'completion_rate': 'Completion Rate',
    'overview': 'Overview',
    'time_period': 'Time Period',
    'this_week': 'This Week',
    'this_month': 'This Month',
    'statistics_by_tag': 'Statistics by Tag',
    'no_tasks_with_tags': 'No tasks with tags yet',
    'day': 'Day',
    'week': 'Week',
    'month': 'Month',
  },
  zh: {
    'settings': '设置',
    'notifications': '通知',
    'enable_push_notifications': '启用推送通知',
    'dark_mode': '深色模式',
    'switch_to_dark_theme': '切换到深色主题',
    'language': '语言',
    'help_support': '帮助与支持',
    'get_help': '获取帮助并联系支持',
    'about': '关于',
    'app_version': '应用版本 1.0.0',
    'tag_management': '标签管理',
    'add_new_tag': '添加新标签',
    'edit_tag': '编辑标签',
    'logout': '退出登录',
    'today': '今天',
    'data': '数据',
    'profile': '个人资料',
    'total_tasks': '总任务',
    'completed': '已完成',
    'pending': '待办',
    'completion_rate': '完成率',
    'overview': '概览',
    'time_period': '时间段',
    'this_week': '本周',
    'this_month': '本月',
    'statistics_by_tag': '按标签统计',
    'no_tasks_with_tags': '还没有带标签的任务',
    'day': '日',
    'week': '周',
    'month': '月',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

