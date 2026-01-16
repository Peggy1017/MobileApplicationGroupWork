import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
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
    'no_tasks_yet': 'No tasks yet',
    'add_task_to_get_started': 'Add a task to get started',
    'check_today_review': 'check today review >',
    'check_review': 'check review >',
    'user_profile': 'User Profile',
    'primary_color': 'Primary Color',
    'theme_shop': 'Theme Shop',
    'of_completed': 'of {count} completed',
    'no_completed_tasks_today': 'No completed tasks today',
    'complete_some_tasks': 'Complete some tasks to see them here',
    'task_statistics': 'Task Statistics',
    'today_review': 'Today Review',
    'end': 'End',
    'task_completed': 'Task completed!',
    'focus_completed': 'Focus completed!',
    'english': 'English',
    'chinese': '中文',
    'default': 'Default',
    'coins': 'Coins',
    'progress': 'Progress',
    'no_data_for_period': 'No data for this period',
    'total': 'Total',
    'total_duration': 'Total Duration',
    'select_date': 'Select Date',
    'done': 'Done',
    'time_blocks_of_day': 'Time Blocks of the Day',
    'time_blocks_of_week': 'Time Blocks of the Week',
    'time_blocks_of_month': 'Time Blocks of the Month',
    'each_block_10_minutes': 'Each time block represents 10 minutes',
    'each_block_one_hour': 'Each time block represents one hour',
    'tag_proportion_of_day': 'Tag Proportion of the Day',
    'tag_proportion_of_week': 'Tag Proportion of the Week',
    'tag_proportion_of_month': 'Tag Proportion of the Month',
    'tag_proportion_subtitle_day': 'Shows the distribution of different tags throughout the day.',
    'tag_proportion_subtitle_week': 'Shows the distribution of different tags throughout the week.',
    'tag_proportion_subtitle_month': 'Shows the distribution of different tags throughout the month.',
    'no_completed_tasks_period': 'No completed tasks for this period',
    'schedule': 'Schedule',
    'add_task': 'Add Task',
    'save': 'Save',
    'task_name': 'Task Name',
    'enter_task_name': 'Enter task name',
    'date': 'Date',
    'tag': 'Tag',
    'priority': 'Priority',
    'priority_urgent': 'Urgent',
    'priority_high': 'High Priority',
    'priority_medium': 'Medium Priority',
    'priority_low': 'Low Priority',
    'notes': 'Notes',
    'add_notes': 'Add notes...',
    'close': 'Close',
    'error': 'Error',
    'please_login_first': 'Please login first to create tasks',
    'please_enter_task_name': 'Please enter a task name',
    'failed_to_save_task': 'Failed to save task. Please try again.',
    'select_tag': 'Select Tag',
    'no_tag': 'No Tag',
    'edit_task_name': 'Edit Task Name',
    'cancel': 'Cancel',
    'minutes': 'Minutes',
    'seconds': 'Seconds',
    'stop_timer': 'Stop Timer',
    'task_duration': 'Task duration',
    'is_task_completed': 'Is task "{taskName}" completed?',
    'not_completed': 'Not Completed',
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
    'no_tasks_yet': '还没有任务',
    'add_task_to_get_started': '添加任务开始吧',
    'check_today_review': '查看今日回顾 >',
    'check_review': '查看回顾 >',
    'user_profile': '用户资料',
    'primary_color': '主色调',
    'theme_shop': '主题商店',
    'of_completed': '已完成 {count} 个',
    'no_completed_tasks_today': '今天没有完成的任务',
    'complete_some_tasks': '完成一些任务后在这里查看',
    'task_statistics': '任务统计',
    'today_review': '今日回顾',
    'end': '结束',
    'task_completed': '任务已完成！',
    'focus_completed': '专注完成！',
    'english': 'English',
    'chinese': '中文',
    'default': '默认',
    'coins': '金币',
    'progress': '进度',
    'no_data_for_period': '此时间段无数据',
    'total': '总计',
    'total_duration': '总时长',
    'select_date': '选择日期',
    'done': '完成',
    'time_blocks_of_day': '当日时间块',
    'time_blocks_of_week': '本周时间块',
    'time_blocks_of_month': '本月时间块',
    'each_block_10_minutes': '每个时间块代表 10 分钟',
    'each_block_one_hour': '每个时间块代表 1 小时',
    'tag_proportion_of_day': '当日标签分布',
    'tag_proportion_of_week': '本周标签分布',
    'tag_proportion_of_month': '本月标签分布',
    'tag_proportion_subtitle_day': '显示一天中不同标签的分布情况。',
    'tag_proportion_subtitle_week': '显示一周中不同标签的分布情况。',
    'tag_proportion_subtitle_month': '显示一个月中不同标签的分布情况。',
    'no_completed_tasks_period': '此时间段没有完成的任务',
    'schedule': '日程',
    'add_task': '添加任务',
    'save': '保存',
    'task_name': '任务名称',
    'enter_task_name': '输入任务名称',
    'date': '日期',
    'tag': '标签',
    'priority': '优先级',
    'priority_urgent': '紧急',
    'priority_high': '高优先级',
    'priority_medium': '中优先级',
    'priority_low': '低优先级',
    'notes': '备注',
    'add_notes': '添加备注...',
    'close': '关闭',
    'error': '错误',
    'please_login_first': '请先登录以创建任务',
    'please_enter_task_name': '请输入任务名称',
    'failed_to_save_task': '保存任务失败，请重试。',
    'select_tag': '选择标签',
    'no_tag': '无标签',
    'edit_task_name': '编辑任务名称',
    'cancel': '取消',
    'minutes': '分钟',
    'seconds': '秒',
    'stop_timer': '停止计时',
    'task_duration': '任务时长',
    'is_task_completed': '任务 "{taskName}" 是否已完成？',
    'not_completed': '未完成',
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

  const t = (key: string, params?: { [key: string]: string | number }): string => {
    let text = translations[language][key as keyof typeof translations.en] || key;
    // 替换参数，例如 {count} -> 实际值
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, String(params[param]));
      });
    }
    return text;
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

