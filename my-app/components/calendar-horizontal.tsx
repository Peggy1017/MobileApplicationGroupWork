import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTodos } from '@/contexts/TodoContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = 60;
const DAY_GAP = 12;
const DAYS_TO_SHOW = 7;
const TOTAL_DAYS = 365; // 显示一年（前后各约半年）

interface CalendarHorizontalProps {
  onDateSelect?: (date: Date) => void;
}

export default function CalendarHorizontal({ onDateSelect }: CalendarHorizontalProps) {
  const { todos } = useTodos();
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysArray = () => {
    const days: Date[] = [];
    const today = new Date();
    // 生成前后各约半年的日期，今天在中间
    const startOffset = -Math.floor(TOTAL_DAYS / 2);
    for (let i = startOffset; i < TOTAL_DAYS + startOffset; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDaysArray();

  // 计算今天的位置，使其居中
  useEffect(() => {
    const today = new Date();
    const todayIndex = days.findIndex(d => d.toDateString() === today.toDateString());
    if (todayIndex >= 0 && scrollViewRef.current) {
      // 计算初始滚动位置，使今天居中
      const scrollToX = todayIndex * (DAY_WIDTH + DAY_GAP) - (SCREEN_WIDTH / 2) + (DAY_WIDTH / 2);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, scrollToX),
          animated: false,
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTasksForDate = (date: Date) => {
    // 使用 UTC 日期进行比较，避免时区问题
    const dateYear = date.getUTCFullYear();
    const dateMonth = date.getUTCMonth();
    const dateDay = date.getUTCDate();
    
    return todos.filter((todo) => {
      // 如果有 completedAt（结束时间），使用 completedAt 的日期
      // 否则使用 createdAt 的日期
      const todoDate = todo.completedAt 
        ? new Date(todo.completedAt)
        : new Date(todo.createdAt);
      // 使用 UTC 日期进行比较，避免时区问题
      const todoYear = todoDate.getUTCFullYear();
      const todoMonth = todoDate.getUTCMonth();
      const todoDay = todoDate.getUTCDate();
      
      return todoYear === dateYear && 
             todoMonth === dateMonth && 
             todoDay === dateDay;
    });
  };

  const formatDay = (date: Date) => {
    return date.getDate().toString();
  };

  const formatWeekday = (date: Date) => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekdays[date.getDay()];
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={DAY_WIDTH + DAY_GAP}
        decelerationRate="fast"
        pagingEnabled={false}
      >
        {days.map((date, index) => {
          const tasks = getTasksForDate(date);
          const completedTasks = tasks.filter((t) => t.completed).length;
          const totalTasks = tasks.length;
          const isSelectedDate = isSelected(date);
          const isTodayDate = isToday(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                { backgroundColor: colors.surface },
                isTodayDate && { backgroundColor: colors.primary },
                isSelectedDate && !isTodayDate && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => handleDatePress(date)}
            >
              <Text style={[
                styles.weekday,
                { color: isTodayDate ? '#fff' : colors.textSecondary },
                isTodayDate && styles.weekdayToday
              ]}>
                {formatWeekday(date)}
              </Text>
              <Text style={[
                styles.day,
                { color: isTodayDate ? '#fff' : colors.text },
                isTodayDate && styles.dayToday
              ]}>
                {formatDay(date)}
              </Text>
              {totalTasks > 0 && (
                <View style={[styles.taskIndicator, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.taskBar,
                      {
                        width: `${(completedTasks / totalTasks) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', // 会被动态样式覆盖为 transparent
  },
  scrollContent: {
    paddingHorizontal: SCREEN_WIDTH / 2 - DAY_WIDTH / 2,
    paddingVertical: 12,
    gap: DAY_GAP,
  },
  dayCard: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5', // 会被动态样式覆盖
  },
  weekday: {
    fontSize: 12,
    color: '#666', // 会被动态样式覆盖
    marginBottom: 4,
  },
  weekdayToday: {
    color: '#fff',
    fontWeight: '600',
  },
  day: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333', // 会被动态样式覆盖
  },
  dayToday: {
    color: '#fff',
  },
  taskIndicator: {
    width: '100%',
    height: 3,
    backgroundColor: '#e0e0e0', // 会被动态样式覆盖
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  taskBar: {
    height: '100%',
    borderRadius: 2,
  },
});

