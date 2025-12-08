import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTodos } from '@/contexts/TodoContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import TimeBlocksVisualization from '@/components/time-blocks-visualization';
import { Tag } from '@/types/todo';

type PeriodType = 'day' | 'week' | 'month';

const API_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : 'http://your-server-ip:3000';

export default function DataScreen() {
  const { todos } = useTodos();
  const { currentUser } = useUser();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    rate: 0,
    tagStats: [] as any[],
    dailyData: {} as { [key: string]: { total: number; completed: number } },
  });
  const [loading, setLoading] = useState(false);


  const StatCard = ({ icon, title, value, color }: { icon: string; title: string; value: string | number; color: string }) => {
    const { colors: themeColors } = useTheme();
    return (
      <View style={[styles.statCard, { backgroundColor: themeColors.surface, borderLeftColor: color }]}>
        <View style={styles.statIconContainer}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: themeColors.text }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: themeColors.textSecondary }]}>{title}</Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    loadStats();
  }, [period, currentUser, todos]);

  const loadStats = async () => {
    if (!currentUser) {
      // 如果没有登录，使用本地数据
      calculateLocalStats();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/todos/stats?userId=${currentUser}&period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        calculateLocalStats();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      calculateLocalStats();
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalStats = () => {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const periodTodos = todos.filter(t => {
      const created = new Date(t.createdAt);
      return created >= startDate;
    });

    const completed = periodTodos.filter(t => t.completed).length;
    const total = periodTodos.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 按标签统计（包含时长）
    const tagStatsMap: { [key: string]: any } = {};
    periodTodos.forEach(todo => {
      const tagId = todo.tag?.id || 'no-tag';
      if (!tagStatsMap[tagId]) {
        tagStatsMap[tagId] = {
          tag: todo.tag || { id: 'no-tag', name: '无标签', color: '#999' },
          total: 0,
          completed: 0,
          totalDuration: 0, // 总时长（分钟）
        };
      }
      tagStatsMap[tagId].total++;
      
      // Calculate duration from start and end time if available
      let taskDuration = todo.duration;
      if (!taskDuration && todo.startedAt && todo.completedAt) {
        const durationMs = new Date(todo.completedAt).getTime() - new Date(todo.startedAt).getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        taskDuration = durationSeconds < 60 ? durationSeconds / 60 : Math.floor(durationSeconds / 60);
      }
      
      if (todo.completed) {
        tagStatsMap[tagId].completed++;
      }
      
      // 累加所有任务的时长（包括已完成和未完成的，从计时器记录，包括小于1分钟的）
      if (taskDuration !== undefined) {
        tagStatsMap[tagId].totalDuration += taskDuration;
      }
    });

    // 按日期分组
    const dailyData: { [key: string]: { total: number; completed: number } } = {};
    periodTodos.forEach(todo => {
      const dateKey = new Date(todo.createdAt).toDateString();
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { total: 0, completed: 0 };
      }
      dailyData[dateKey].total++;
      if (todo.completed) {
        dailyData[dateKey].completed++;
      }
    });

    setStats({
      total,
      completed,
      pending: total - completed,
      rate,
      tagStats: Object.values(tagStatsMap),
      dailyData,
    });
  };

  // 使用从后端获取的数据
  const periodData = useMemo(() => {
    return {
      completed: stats.completed,
      total: stats.total,
      rate: stats.rate,
      dailyData: stats.dailyData,
    };
  }, [stats]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Data</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Task Statistics</Text>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: colors.background },
              period === 'day' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setPeriod('day')}
          >
            <Text style={[
              styles.periodButtonText,
              { color: period === 'day' ? '#fff' : colors.text },
            ]}>
              {t('day')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: colors.background },
              period === 'week' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[
              styles.periodButtonText,
              { color: period === 'week' ? '#fff' : colors.text },
            ]}>
              {t('week')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: colors.background },
              period === 'month' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              { color: period === 'month' ? '#fff' : colors.text },
            ]}>
              {t('month')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Blocks Visualization - Show for all periods */}
        <TimeBlocksVisualization todos={todos} period={period} />

        {/* Chart Section */}
        <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {period === 'day' ? t('day') : period === 'week' ? t('week') : t('month')} Progress
          </Text>
          <View style={styles.chartWrapper}>
            {Object.keys(periodData.dailyData).length > 0 ? (
              <View style={styles.barChart}>
                {Object.entries(periodData.dailyData).map(([date, data]) => {
                  const maxValue = Math.max(...Object.values(periodData.dailyData).map(d => d.total), 1);
                  const totalHeight = 100;
                  const completedHeight = (data.completed / maxValue) * totalHeight;
                  const totalBarHeight = (data.total / maxValue) * totalHeight;
                  
                  return (
                    <View key={date} style={styles.barChartItem}>
                      <View style={styles.barChartBars}>
                        <View style={[
                          styles.barChartBar,
                          styles.barChartBarTotal,
                          { height: totalBarHeight, backgroundColor: colors.border },
                        ]} />
                        <View style={[
                          styles.barChartBar,
                          styles.barChartBarCompleted,
                          { height: completedHeight, backgroundColor: '#34C759' },
                        ]} />
                      </View>
                      <Text style={[styles.barChartLabel, { color: colors.textSecondary }]}>
                        {new Date(date).getDate()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                  No data for this period
                </Text>
              </View>
            )}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#34C759' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.border }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Total</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('overview')}</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="list"
              title={t('total_tasks')}
              value={stats.total}
              color={colors.primary}
            />
            <StatCard
              icon="checkmark-circle"
              title={t('completed')}
              value={stats.completed}
              color="#34C759"
            />
            <StatCard
              icon="time-outline"
              title={t('pending')}
              value={stats.pending}
              color="#FF9500"
            />
            <StatCard
              icon="trending-up"
              title={t('completion_rate')}
              value={`${stats.rate}%`}
              color="#AF52DE"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('statistics_by_tag')}</Text>
          {stats.tagStats.length === 0 ? (
            <View style={[styles.emptyTagContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyTagText, { color: colors.textSecondary }]}>{t('no_tasks_with_tags')}</Text>
            </View>
          ) : (
            stats.tagStats.map((stat: any) => {
              const completionRate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
              return (
                <View key={stat.tag.id} style={[styles.tagStatCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.tagStatHeader}>
                    <View style={[styles.tagStatColorDot, { backgroundColor: stat.tag.color }]} />
                    <Text style={[styles.tagStatName, { color: colors.text }]}>{stat.tag.name}</Text>
                  </View>
                  <View style={styles.tagStatGrid}>
                    <View style={styles.tagStatItem}>
                      <Text style={[styles.tagStatValue, { color: colors.text }]}>{stat.total}</Text>
                      <Text style={[styles.tagStatLabel, { color: colors.textSecondary }]}>{t('total_tasks')}</Text>
                    </View>
                    <View style={styles.tagStatItem}>
                      <Text style={[styles.tagStatValue, { color: '#34C759' }]}>{stat.completed}</Text>
                      <Text style={[styles.tagStatLabel, { color: colors.textSecondary }]}>{t('completed')}</Text>
                    </View>
                    <View style={styles.tagStatItem}>
                      <Text style={[styles.tagStatValue, { color: '#FF9500' }]}>{stat.total - stat.completed}</Text>
                      <Text style={[styles.tagStatLabel, { color: colors.textSecondary }]}>{t('pending')}</Text>
                    </View>
                    <View style={styles.tagStatItem}>
                      <Text style={[styles.tagStatValue, { color: stat.tag.color }]}>{completionRate}%</Text>
                      <Text style={[styles.tagStatLabel, { color: colors.textSecondary }]}>{t('completion_rate')}</Text>
                    </View>
                  </View>
                  {stat.totalDuration !== undefined && stat.totalDuration > 0 && (
                    <View style={styles.tagStatDuration}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.tagStatDurationText, { color: colors.textSecondary }]}>
                        Total Duration: {
                          stat.totalDuration < 1 
                            ? `${Math.round(stat.totalDuration * 60)}s`
                            : stat.totalDuration < 60
                              ? `${stat.totalDuration} min`
                              : `${Math.floor(stat.totalDuration / 60)}h ${Math.round(stat.totalDuration % 60)}m`
                        }
                      </Text>
                    </View>
                  )}
                  <View style={[styles.tagStatProgressBar, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.tagStatProgressFill, 
                        { 
                          width: `${completionRate}%`, 
                          backgroundColor: stat.tag.color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },
  chartContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartWrapper: {
    marginTop: 16,
    minHeight: 150,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    paddingHorizontal: 8,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  barChartBars: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barChartBar: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderRadius: 4,
  },
  barChartBarTotal: {
    opacity: 0.3,
  },
  barChartBarCompleted: {
    zIndex: 1,
  },
  barChartLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  emptyChart: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
  },
  chart: {
    marginTop: 16,
  },
  chartBar: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  chartFill: {
    height: '100%',
    borderRadius: 12,
  },
  chartLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyTagContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyTagText: {
    fontSize: 14,
    color: '#999',
  },
  tagStatCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagStatColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  tagStatName: {
    fontSize: 18,
    fontWeight: '600',
  },
  tagStatGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  tagStatItem: {
    alignItems: 'center',
  },
  tagStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagStatLabel: {
    fontSize: 12,
  },
  tagStatTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagStatTimeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tagStatProgressBar: {
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tagStatProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tagStatDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  tagStatDurationText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

