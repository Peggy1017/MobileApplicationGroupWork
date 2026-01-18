import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { TodoItem, Tag } from '@/types/todo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCoins } from '@/modules/coins/context/CoinContext';

interface TimeBlockData {
  tag: Tag;
  totalMinutes: number;
  percentage: number;
  blocks: number;
}

interface TimeBlocksVisualizationProps {
  todos: TodoItem[];
  period?: 'day' | 'week' | 'month';
  date?: Date;
}

const screenWidth = Dimensions.get('window').width;

export default function TimeBlocksVisualization({ todos, period = 'day', date = new Date() }: TimeBlocksVisualizationProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { currentThemeData } = useCoins();
  
  // 检查是否为默认主题
  const isDefaultTheme = currentThemeData?.isDefault ?? false;

  // Calculate time blocks data from completed tasks
  const timeBlockData = useMemo(() => {
    const targetDate = new Date(date);
    let startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);

    // 计算结束日期
    let endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    if (period === 'week') {
      // Week: 显示目标日期所在周（从周一到周日）
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 如果是周日，距离周一6天；否则减1
      startDate.setDate(targetDate.getDate() - daysFromMonday);
      startDate.setHours(0, 0, 0, 0);
      // 结束日期是这周的周日
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      // Month: 显示目标日期所在月（从1号开始到最后一天）
      startDate.setDate(1); // 设置为当月1号
      startDate.setHours(0, 0, 0, 0);
      // 结束日期是当月的最后一天
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0); // 下个月的第0天 = 当月的最后一天
      endDate.setHours(23, 59, 59, 999);
    }

    // Filter tasks with duration (completed or with start/end time)
    const completedTasks = todos.filter(todo => {
      // Include tasks with duration or with start/end time
      const hasDuration = todo.duration !== undefined && todo.duration > 0;
      const hasStartEndTime = todo.startedAt && todo.completedAt;
      if (!hasDuration && !hasStartEndTime) return false;

      // Use completedAt if available, otherwise use createdAt
      const taskDate = todo.completedAt ? new Date(todo.completedAt) : new Date(todo.createdAt);
      return taskDate >= startDate && taskDate <= endDate;
    });

    // Group by tag and calculate total minutes
    const tagMap = new Map<string, { tag: Tag; totalMinutes: number }>();

    completedTasks.forEach(todo => {
      if (!todo.tag) return;

      // Calculate duration from start and end time if available
      let taskDuration = todo.duration;
      if (taskDuration === undefined && todo.startedAt && todo.completedAt) {
        const durationMs = new Date(todo.completedAt).getTime() - new Date(todo.startedAt).getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        taskDuration = durationSeconds < 60 ? durationSeconds / 60 : Math.floor(durationSeconds / 60);
      }

      if (taskDuration === undefined || taskDuration <= 0) return;

      const tagId = todo.tag.id;
      if (!tagMap.has(tagId)) {
        tagMap.set(tagId, {
          tag: todo.tag,
          totalMinutes: 0,
        });
      }

      const data = tagMap.get(tagId)!;
      data.totalMinutes += taskDuration;
    });

    // Calculate total minutes
    const totalMinutes = Array.from(tagMap.values()).reduce(
      (sum, data) => sum + data.totalMinutes,
      0
    );

    // Convert to TimeBlockData array
    const result: TimeBlockData[] = Array.from(tagMap.values()).map(data => {
      // For week/month: blocks = hours, for day: blocks = 10-minute blocks
      const blocks = period === 'day'
        ? Math.round(data.totalMinutes / 10)
        : Math.round(data.totalMinutes / 60);
      // Percentage = this tag's minutes / total minutes of all tags
      const percentage = totalMinutes > 0 ? (data.totalMinutes / totalMinutes) * 100 : 0;

      return {
        tag: data.tag,
        totalMinutes: data.totalMinutes,
        percentage,
        blocks,
      };
    });

    // Sort by total minutes descending
    return result.sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [todos, period, date]);

  // Generate time blocks grid
  const { timeBlocks, gridConfig } = useMemo(() => {
    // 调整色块颜色的函数：非默认主题时添加透明度，使其与背景更协调
    const adjustBlockColor = (color: string): string => {
      if (isDefaultTheme) {
        return color; // 默认主题使用原始颜色
      }
      // 非默认主题时，添加透明度，使色块与背景更协调
      // 将颜色转换为 rgba 格式，添加 0.6 的透明度
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    };

    const targetDate = new Date(date);
    let startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);

    // 计算结束日期
    let endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    let days = 1;
    let hoursPerDay = 24;
    let blocksPerHour = 6; // For day: 6 blocks per hour (10 min each)

    if (period === 'week') {
      // Week: 显示目标日期所在周（从周一到周日）
      days = 7;
      blocksPerHour = 1; // 1 block per hour
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 如果是周日，距离周一6天；否则减1
      startDate.setDate(targetDate.getDate() - daysFromMonday);
      startDate.setHours(0, 0, 0, 0);
      // 结束日期是这周的周日
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      // Month: 显示目标日期所在月（从1号开始到最后一天）
      startDate.setDate(1); // 设置为当月1号
      startDate.setHours(0, 0, 0, 0);
      // 结束日期是当月的最后一天
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0); // 下个月的第0天 = 当月的最后一天
      endDate.setHours(23, 59, 59, 999);
      // 计算当月的天数
      days = endDate.getDate();
      blocksPerHour = 1; // 1 block per hour
    }

    const totalBlocks = days * hoursPerDay * blocksPerHour;
    const blocks: { color: string; tagName: string }[] = [];

    // Initialize all blocks as empty
    for (let i = 0; i < totalBlocks; i++) {
      blocks.push({ color: colors.border, tagName: '' });
    }

    // Get tasks with duration, sorted by completion time or start time
    const completedTasks = todos
      .filter(todo => {
        if (!todo.tag) return false;
        // Include tasks with duration or with start/end time
        const hasDuration = todo.duration !== undefined && todo.duration > 0;
        const hasStartEndTime = todo.startedAt && todo.completedAt;
        if (!hasDuration && !hasStartEndTime) return false;

        // Use completedAt if available, otherwise use startedAt or createdAt
        const taskDate = todo.completedAt
          ? new Date(todo.completedAt)
          : (todo.startedAt ? new Date(todo.startedAt) : new Date(todo.createdAt));
        // 检查任务日期是否在范围内（startDate 到 endDate）
        return taskDate >= startDate && taskDate <= endDate;
      })
      .sort((a, b) => {
        // Sort by completedAt, startedAt, or createdAt
        const timeA = a.completedAt
          ? new Date(a.completedAt).getTime()
          : (a.startedAt ? new Date(a.startedAt).getTime() : new Date(a.createdAt).getTime());
        const timeB = b.completedAt
          ? new Date(b.completedAt).getTime()
          : (b.startedAt ? new Date(b.startedAt).getTime() : new Date(b.createdAt).getTime());
        return timeA - timeB;
      });

    // Fill blocks based on task completion time and duration
    completedTasks.forEach(todo => {
      if (!todo.tag) return;

      // Calculate duration from start and end time if available
      let taskDuration = todo.duration;
      if (taskDuration === undefined && todo.startedAt && todo.completedAt) {
        const durationMs = new Date(todo.completedAt).getTime() - new Date(todo.startedAt).getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        taskDuration = durationSeconds < 60 ? durationSeconds / 60 : Math.floor(durationSeconds / 60);
      }

      if (taskDuration === undefined || taskDuration <= 0) return;

      // Use completedAt if available, otherwise use startedAt or createdAt
      const completedTime = todo.completedAt
        ? new Date(todo.completedAt)
        : (todo.startedAt ? new Date(todo.startedAt) : new Date(todo.createdAt));
      const dayIndex = Math.floor((completedTime.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayIndex < 0 || dayIndex >= days) return;

      const hour = completedTime.getHours();
      const minute = completedTime.getMinutes();

      if (period === 'day') {
        // Day: 10-minute blocks
        const startMinutes = hour * 60 + minute;
        const durationBlocks = Math.ceil(taskDuration / 10);
        const startBlock = Math.max(0, Math.floor((startMinutes - taskDuration) / 10));
        const endBlock = Math.min(hoursPerDay * blocksPerHour, startBlock + durationBlocks);

        for (let i = startBlock; i < endBlock && i < hoursPerDay * blocksPerHour; i++) {
          const blockIdx = i;
          if (blocks[blockIdx] && blocks[blockIdx].tagName === '') {
            blocks[blockIdx] = {
              color: adjustBlockColor(todo.tag.color),
              tagName: todo.tag.name,
            };
          }
        }
      } else {
        // Week/Month: 1-hour blocks
        // Calculate which hour blocks this task occupies
        const durationHours = Math.ceil(taskDuration / 60);
        // Start from the hour when task was completed, going backwards
        const startHour = Math.max(0, hour - durationHours + 1);
        const endHour = Math.min(hoursPerDay, hour + 1);

        for (let h = startHour; h < endHour && h < hoursPerDay; h++) {
          const blockIdx = dayIndex * hoursPerDay * blocksPerHour + h * blocksPerHour;
          if (blockIdx < blocks.length && blocks[blockIdx] && blocks[blockIdx].tagName === '') {
            blocks[blockIdx] = {
              color: adjustBlockColor(todo.tag.color),
              tagName: todo.tag.name,
            };
          }
        }
      }
    });

    return {
      timeBlocks: blocks,
      gridConfig: { days, hoursPerDay, blocksPerHour, totalBlocks },
    };
  }, [todos, colors.border, period, date, isDefaultTheme]);

  // ... (pieChartData, totalMinutes... unchanged logic but dependencies updated) ...
  // Calculate pie chart data
  const pieChartData = useMemo(() => {
    const totalMinutes = timeBlockData.reduce((sum, data) => sum + data.totalMinutes, 0);
    if (totalMinutes === 0) return null;

    return timeBlockData.map(data => ({
      name: `${data.tag.name} (${data.totalMinutes}min)`,
      population: data.totalMinutes,
      color: data.tag.color,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }, [timeBlockData, colors.text]);

  const totalMinutes = timeBlockData.reduce((sum, data) => sum + data.totalMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Get completed count based on period
  const completedCount = useMemo(() => {
    const targetDate = new Date(date);
    let startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);

    // 计算结束日期
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    if (period === 'week') {
      startDate.setDate(targetDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(targetDate.getMonth() - 1);
    }

    return todos.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= startDate && completedDate <= endDate;
    }).length;
  }, [todos, period, date]);

  // ... (getTitle, getSubtitle functions unchanged) ...
  const getTitle = () => {
    if (period === 'week') return t('time_blocks_of_week');
    if (period === 'month') return t('time_blocks_of_month');
    return t('time_blocks_of_day');
  };

  const getSubtitle = () => {
    if (period === 'week' || period === 'month') {
      return t('each_block_one_hour');
    }
    return t('each_block_10_minutes');
  };

  const getProportionTitle = () => {
    if (period === 'week') return t('tag_proportion_of_week');
    if (period === 'month') return t('tag_proportion_of_month');
    return t('tag_proportion_of_day');
  };

  const getProportionSubtitle = () => {
    if (period === 'week') {
      return t('tag_proportion_subtitle_week');
    }
    if (period === 'month') {
      return t('tag_proportion_subtitle_month');
    }
    return t('tag_proportion_subtitle_day');
  };

  // Render time blocks grid based on period
  const renderTimeBlocksGrid = () => {
    if (period === 'day') {
      return (
        <View style={styles.timeBlocksGridContainer}>
          <View style={styles.timeBlocksGrid}>
            {/* Morning Section (0-11 hours) */}
            <View style={styles.periodColumn}>
              <Text style={[styles.periodLabel, { color: colors.text }]}>AM</Text>
              <View style={styles.blocksContainer}>
                {Array.from({ length: 12 }).map((_, rowIndex) => (
                  <View key={rowIndex} style={styles.blockRow}>
                    {Array.from({ length: 6 }).map((_, blockIndex) => {
                      const blockIdx = rowIndex * 6 + blockIndex;
                      const block = timeBlocks[blockIdx] || { color: colors.border, tagName: '' };
                      return (
                        <View
                          key={blockIndex}
                          style={[
                            styles.timeBlock,
                            { backgroundColor: block.color },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Middle Labels (0-11) */}
            <View style={styles.labelsColumn}>
              <Text style={styles.periodLabel}> </Text>
              {/* Spacer to align with AM/PM labels */}
              <View style={styles.labelsContainer}>
                {Array.from({ length: 12 }).map((_, rowIndex) => (
                  <View key={rowIndex} style={styles.labelRow}>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                      {rowIndex}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Afternoon Section (12-23 hours) */}
            <View style={styles.periodColumn}>
              <Text style={[styles.periodLabel, { color: colors.text }]}>PM</Text>
              <View style={styles.blocksContainer}>
                {Array.from({ length: 12 }).map((_, rowIndex) => (
                  <View key={rowIndex} style={styles.blockRow}>
                    {Array.from({ length: 6 }).map((_, blockIndex) => {
                      const blockIdx = (rowIndex + 12) * 6 + blockIndex;
                      const block = timeBlocks[blockIdx] || { color: colors.border, tagName: '' };
                      return (
                        <View
                          key={blockIndex}
                          style={[
                            styles.timeBlock,
                            { backgroundColor: block.color },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      );
    } else {
      // Week or Month: Show days as columns, hours as rows
      const { days, hoursPerDay, blocksPerHour } = gridConfig;
      const targetDate = new Date(date);
      let startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);

      if (period === 'week') {
        // Week: 显示目标日期所在周（从周一到周日）
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 如果是周日，距离周一6天；否则减1
        startDate.setDate(targetDate.getDate() - daysFromMonday);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        // Month: 显示目标日期所在月（从1号开始到最后一天）
        startDate.setDate(1); // 设置为当月1号
        startDate.setHours(0, 0, 0, 0);
      }

      const dayLabels = period === 'week'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : Array.from({ length: days }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          return date.getDate().toString();
        });

      return (
        <View style={styles.timeBlocksGridContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weekMonthGrid}>
              {/* Hour labels on the left */}
              <View style={styles.hourLabelsColumn}>
                {Array.from({ length: 24 }).map((_, idx) => {
                  const showLabel = [0, 6, 12, 18].includes(idx);
                  return (
                    <Text
                      key={idx}
                      style={[
                        styles.hourLabel,
                        { color: colors.textSecondary },
                        !showLabel && styles.hourLabelHidden
                      ]}
                    >
                      {showLabel ? `${idx}-` : ''}
                    </Text>
                  );
                })}
              </View>

              {/* Day columns */}
              <View style={styles.daysContainer}>
                {Array.from({ length: days }).map((_, dayIndex) => (
                  <View key={dayIndex} style={styles.dayColumn}>
                    <Text style={[styles.dayLabel, { color: colors.text }]}>
                      {dayLabels[dayIndex]}
                    </Text>
                    <View style={styles.dayBlocks}>
                      {Array.from({ length: hoursPerDay }).map((_, hourIndex) => {
                        const blockIdx = dayIndex * hoursPerDay * blocksPerHour + hourIndex * blocksPerHour;
                        const block = timeBlocks[blockIdx] || { color: colors.border, tagName: '' };
                        return (
                          <View
                            key={hourIndex}
                            style={[
                              styles.hourBlock,
                              { backgroundColor: block.color },
                            ]}
                          />
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overview Section */}
      <View style={[styles.overviewSection, { backgroundColor: colors.surface }]}>
        <View style={styles.overviewHeader}>
          <Ionicons name="chevron-up" size={16} color={colors.textSecondary} />
          <Text style={[styles.overviewTitle, { color: colors.text }]}>{t('overview')}</Text>
        </View>
        <View style={styles.overviewMetrics}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {completedCount}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('schedule')}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {totalHours}h {remainingMinutes.toFixed(2)}m
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('total_duration')}</Text>
          </View>
        </View>
      </View>

      {/* Time Blocks Section */}
      <View style={[styles.timeBlocksSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{getTitle()}</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {getSubtitle()}
        </Text>

        {renderTimeBlocksGrid()}
      </View>

      {/* Tag Proportion Section */}
      <View style={[styles.proportionSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {getProportionTitle()}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {getProportionSubtitle()}
        </Text>

        {/* Pie Chart */}
        {pieChartData && pieChartData.length > 0 ? (
          <View style={styles.pieChartContainer}>
            <PieChart
              data={pieChartData}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('no_completed_tasks_period')}
            </Text>
          </View>
        )}

        {/* Tag List with Progress Bars */}
        <View style={styles.tagList}>
          {timeBlockData.map((data, index) => {
            const totalMinutes = data.totalMinutes;
            const hours = Math.floor(totalMinutes / 60);
            const remainingMinutes = totalMinutes % 60;
            const displayPercentage = data.percentage;

            return (
              <View key={data.tag.id || index} style={styles.tagItem}>
                <View style={styles.tagItemHeader}>
                  <Text style={[styles.tagPercentage, { color: colors.text }]}>
                    {displayPercentage.toFixed(1)}%
                  </Text>
                  <View style={styles.tagInfo}>
                    <View style={[styles.tagColorDot, { backgroundColor: data.tag.color }]} />
                    <Text style={[styles.tagName, { color: colors.text }]}>{data.tag.name}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
                <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${displayPercentage}%`,
                        backgroundColor: data.tag.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.tagDuration, { color: colors.textSecondary }]}>
                  {hours > 0 ? `${hours}h ` : ''}
                  {remainingMinutes < 1 && remainingMinutes > 0
                    ? `${(remainingMinutes * 60).toFixed(2)}s`
                    : remainingMinutes >= 1
                      ? `${remainingMinutes.toFixed(2)}m`
                      : remainingMinutes > 0
                        ? `${remainingMinutes.toFixed(2)}m`
                        : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overviewSection: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  overviewMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
  },
  timeBlocksSection: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  timeBlocksGridContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  timeBlocksGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  periodColumn: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  blocksContainer: {
    gap: 4,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  timeBlock: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  rowLabel: {
    fontSize: 10,
    width: 20,
    textAlign: 'center',
  },
  labelsColumn: {
    width: 30,
    alignItems: 'center',
    paddingTop: 0,
  },
  labelsContainer: {
    gap: 4, // Match blocksContainer gap
    marginTop: 0,
  },
  labelRow: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2, // Match blockRow marginBottom
    height: 10, // Match timeBlock height
  },
  // Week/Month grid styles
  weekMonthGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  hourLabelsColumn: {
    marginRight: 8,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  hourLabel: {
    fontSize: 10,
    height: 12,
    marginBottom: 2,
    textAlign: 'right',
    width: 24,
  },
  hourLabelHidden: {
    opacity: 0,
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dayColumn: {
    alignItems: 'center',
    minWidth: 20,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayBlocks: {
    gap: 1,
  },
  hourBlock: {
    width: 16,
    height: 12,
    borderRadius: 2,
  },
  proportionSection: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  tagList: {
    marginTop: 20,
  },
  tagItem: {
    marginBottom: 16,
  },
  tagItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagPercentage: {
    fontSize: 16,
    fontWeight: '600',
    width: 50,
  },
  tagInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  tagColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  tagDuration: {
    fontSize: 12,
    marginLeft: 62,
  },
});
