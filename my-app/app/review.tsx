import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTodos } from '@/contexts/TodoContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCoins } from '@/modules/coins/context/CoinContext';
import { TodoItem } from '@/types/todo';
import ThemedBackground from '@/components/ThemedBackground';

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { todos } = useTodos();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { currentThemeData } = useCoins();
  
  // 检查是否是 Classic Dark 主题
  const isClassicDark = currentThemeData?.id === 'default_dark' || isDarkMode;

  // Get the date from params, default to today
  const reviewDate = useMemo(() => {
    if (params.date) {
      return new Date(params.date as string);
    }
    return new Date();
  }, [params.date]);

  const todayCompletedTasks = useMemo(() => {
    const targetDate = new Date(reviewDate);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Include both completed tasks and tasks with duration (even if not completed)
    return todos
      .filter((todo) => {
        // Show completed tasks
        if (todo.completed && todo.completedAt) {
          const completedDate = new Date(todo.completedAt);
          return completedDate >= targetDate && completedDate < nextDay;
        }
        // Show tasks with duration (from timer) - 无论是否完成，只要有 duration 和 completedAt 就显示
        if (todo.duration !== undefined && todo.duration > 0 && todo.startedAt && todo.completedAt) {
          const startedDate = new Date(todo.startedAt);
          return startedDate >= targetDate && startedDate < nextDay;
        }
        return false;
      })
      .sort((a, b) => {
        // Sort by start time (earlier first)
        const timeA = a.startedAt ? new Date(a.startedAt).getTime() : (a.completedAt ? new Date(a.completedAt).getTime() : 0);
        const timeB = b.startedAt ? new Date(b.startedAt).getTime() : (b.completedAt ? new Date(b.completedAt).getTime() : 0);
        return timeA - timeB; // 从早到晚
      });
  }, [todos, reviewDate]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const groupTasksByHour = (tasks: TodoItem[]) => {
    const groups: { [key: string]: TodoItem[] } = {};
    tasks.forEach((task) => {
      const date = task.startedAt ? new Date(task.startedAt) : (task.completedAt ? new Date(task.completedAt) : null);
      if (date) {
        const hour = date.getHours();
        const key = `${hour}:00`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(task);
      }
    });
    return groups;
  };

  const taskGroups = groupTasksByHour(todayCompletedTasks);
  const sortedHours = Object.keys(taskGroups).sort((a, b) => {
    const hourA = parseInt(a.split(':')[0]);
    const hourB = parseInt(b.split(':')[0]);
    return hourB - hourA;
  });

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        {currentThemeData && !currentThemeData.isDefault && currentThemeData.type === 'gradient' ? (
          <LinearGradient
            colors={currentThemeData.colors as [string, string, ...string[]]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {reviewDate.toDateString() === new Date().toDateString()
                ? t('today_review')
                : `${reviewDate.getMonth() + 1}/${reviewDate.getDate()} ${t('today_review')}`}
            </Text>
            <View style={styles.placeholder} />
          </LinearGradient>
        ) : (
          <View style={[
            styles.header,
            currentThemeData && !currentThemeData.isDefault && currentThemeData.type === 'solid' && currentThemeData.colors.length > 0
              ? { backgroundColor: currentThemeData.colors[0] }
              : { backgroundColor: colors.surface }
          ]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {reviewDate.toDateString() === new Date().toDateString()
                ? t('today_review')
                : `${reviewDate.getMonth() + 1}/${reviewDate.getDate()} ${t('today_review')}`}
            </Text>
            <View style={styles.placeholder} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {todayCompletedTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>{t('no_completed_tasks_today')}</Text>
              <Text style={styles.emptySubtext}>{t('complete_some_tasks')}</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {sortedHours.map((hour, index) => (
                <View key={hour} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    {index < sortedHours.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={[styles.timeLabel, isClassicDark && { color: '#fff' }, !isClassicDark && { color: '#666' }]}>
                      {hour}
                    </Text>
                    {taskGroups[hour].map((task) => (
                      <View
                        key={task.id}
                        style={[
                          styles.taskCard,
                          isClassicDark && { backgroundColor: colors.background },
                          !isClassicDark && { backgroundColor: '#fff' },
                          task.tag && { borderLeftColor: task.tag.color, borderLeftWidth: 4 },
                        ]}
                      >
                        <View style={styles.taskHeader}>
                          <View style={styles.taskNameContainer}>
                            <Text style={[styles.taskName, isClassicDark && { color: '#fff' }, !isClassicDark && { color: '#333' }]}>
                              {task.text}
                            </Text>
                            {task.startedAt && (
                              <Text style={[styles.taskStartTime, { color: colors.primary }]}>
                                {formatTime(new Date(task.startedAt))}
                              </Text>
                            )}
                          </View>
                        </View>
                        {task.completedAt && (
                          <Text style={[styles.taskEndTime, isClassicDark && { color: '#fff' }, !isClassicDark && { color: '#666' }]}>
                            {t('end')}: {formatTime(new Date(task.completedAt))}
                          </Text>
                        )}
                        {task.tag && (
                          <View style={[styles.tagBadge, { backgroundColor: task.tag.color + '20' }]}>
                            <View style={[styles.tagColorDot, { backgroundColor: task.tag.color }]} />
                            <Text style={[styles.tagText, { color: task.tag.color }]}>
                              {task.tag.name}
                            </Text>
                          </View>
                        )}
                        {task.duration !== undefined && (
                          <View style={styles.taskMeta}>
                            <Ionicons name="time-outline" size={14} color={isClassicDark ? '#fff' : '#666'} />
                            <Text style={[styles.taskMetaText, isClassicDark && { color: '#fff' }, !isClassicDark && { color: '#666' }]}>
                              {task.duration < 1 ? `${Math.round(task.duration * 60)}s` : `${task.duration} min`}
                            </Text>
                          </View>
                        )}
                        {task.notes && (
                          <Text style={[styles.taskNotes, isClassicDark && { color: '#fff' }, !isClassicDark && { color: '#666' }]}>
                            {task.notes}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff', // 会被动态样式覆盖
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333', // 会被动态样式覆盖
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 4,
    minHeight: 40,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 0,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    marginBottom: 8,
  },
  taskNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  taskStartTime: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  taskEndTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  tagColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  taskNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

