import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTodos } from '@/contexts/TodoContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from '@/contexts/UserContext';
import TimeBlocksVisualization from '@/components/time-blocks-visualization';
import DateTimePicker from '@/components/date-time-picker';
import ThemedBackground from '@/components/ThemedBackground';

type PeriodType = 'day' | 'week' | 'month';

export default function DataScreen() {
  const { todos } = useTodos();
  const { currentUser } = useUser();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    rate: 0,
    tagStats: [] as any[],
    dailyData: {} as { [key: string]: { total: number; completed: number } },
  });



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
    calculateLocalStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, currentUser, todos, selectedDate]);

  const calculateLocalStats = () => {
    const targetDate = new Date(selectedDate);
    let startDate = new Date(targetDate);

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(targetDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0); // Start of the day 7 days ago
    } else { // month
      startDate.setMonth(targetDate.getMonth() - 1);
      startDate.setDate(1); // Start of the month 1 month ago
      startDate.setHours(0, 0, 0, 0);
    }

    // End date calculation
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);


    const periodTodos = todos.filter(t => {
      // Check creation date
      const created = new Date(t.createdAt);
      // Check completion date
      const completedAt = t.completedAt ? new Date(t.completedAt) : null;

      // If completed, use completion date; otherwise use creation date
      const checkDate = completedAt || created;
      return checkDate >= startDate && checkDate <= endDate;
    });

    const completed = periodTodos.filter(t => t.completed).length;
    const total = periodTodos.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Statistics by tag (including duration)
    const tagStatsMap: { [key: string]: any } = {};
    periodTodos.forEach(todo => {
      const tagId = todo.tag?.id || 'no-tag';
      if (!tagStatsMap[tagId]) {
        tagStatsMap[tagId] = {
          tag: todo.tag || { id: 'no-tag', name: '无标签', color: '#999' },
          total: 0,
          completed: 0,
          totalDuration: 0, // Total duration (minutes)
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

      // Accumulate task duration
      if (taskDuration !== undefined) {
        tagStatsMap[tagId].totalDuration += taskDuration;
      }
    });

    // Group by date
    const dailyData: { [key: string]: { total: number; completed: number } } = {};
    periodTodos.forEach(todo => {
      // Use completion time if available, otherwise creation time
      const dateObj = todo.completedAt ? new Date(todo.completedAt) : new Date(todo.createdAt);
      const dateKey = dateObj.toDateString();
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

  // Use processed data
  const periodData = useMemo(() => {
    return {
      completed: stats.completed,
      total: stats.total,
      rate: stats.rate,
      dailyData: stats.dailyData,
    };
  }, [stats]);

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{t('data')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('task_statistics')}</Text>
            </View>
            <TouchableOpacity
              style={styles.dateSelectorButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.dateSelectorText, { color: colors.primary }]}>
                {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

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
          <TimeBlocksVisualization todos={todos} period={period} date={selectedDate} />

          {/* Chart Section */}
          <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {period === 'day' ? t('day') : period === 'week' ? t('week') : t('month')} {t('progress')}
            </Text>
            <View style={styles.chartWrapper}>
              {Object.keys(periodData.dailyData).length > 0 ? (
                <View style={styles.barChart}>
                  {Object.entries(periodData.dailyData)
                    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()) // Sort by date
                    .map(([date, data]) => {
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
                    {t('no_data_for_period')}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#34C759' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('completed')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.border }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('total')}</Text>
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
                          {t('total_duration')}: {
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

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('select_date')}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                mode="date"
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCloseButtonText}>{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedBackground>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dateSelectorText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 12,
  },
  tagStatProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

