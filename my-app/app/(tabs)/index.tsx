import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem } from '@/types/todo';
import { useTodos } from '@/contexts/TodoContext';
import { useCoins } from '@/contexts/CoinContext';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import CalendarHorizontal from '@/components/calendar-horizontal';
import DateTimePicker from '@/components/date-time-picker';
import CoinRewardToast from '@/components/CoinRewardToast';
import ThemedBackground from '@/components/ThemedBackground';

export default function TodayScreen() {
  const router = useRouter();
  const { todos, toggleTodo, deleteTodo: deleteTodoFromContext, updateTodo } = useTodos();
  const { rewardCoins } = useCoins();
  const { isLoggedIn } = useUser();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editStartTime, setEditStartTime] = useState<Date | null>(null);
  const [editEndTime, setEditEndTime] = useState<Date | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<TodoItem | null>(null);
  const [editTaskName, setEditTaskName] = useState('');

  const [showCoinReward, setShowCoinReward] = useState(false);
  const [coinRewardAmount, setCoinRewardAmount] = useState(0);

  const filteredTodos = useMemo(() => {
    const selectedDateStr = selectedDate.toDateString();
    const filtered = todos.filter((todo) => {
      const todoDate = new Date(todo.createdAt);
      return todoDate.toDateString() === selectedDateStr;
    });

    // Sort by priority: tasks with lower priority number come first
    // If no priority, treat as lowest priority (999)
    // Same priority: sort by createdAt (earlier first)
    return filtered.sort((a, b) => {
      const priorityA = a.priority ?? a.tag?.priority ?? 999;
      const priorityB = b.priority ?? b.tag?.priority ?? 999;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Same priority: sort by createdAt
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [todos, selectedDate]);

  const handleToggleTodo = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo && todo.completed) {
      // If already completed, clicking the checkbox should uncomplete it
      const updatedTodo = {
        ...todo,
        completed: false,
        completedAt: undefined,
      };
      updateTodo(updatedTodo);
    } else {
      // If not completed, toggle to completed
      toggleTodo(id);

      // Reward coins if the user is logged in
      if (isLoggedIn && todo && !todo.completed) {
        try {
          await rewardCoins('TASK_COMPLETE');
          // Show coin reward animation
          setCoinRewardAmount(5);
          setShowCoinReward(true);
        } catch (error) {
          console.error('Failed to reward coins:', error);
        }
      }
    }
  }, [todos, toggleTodo, updateTodo, isLoggedIn, rewardCoins]);

  const handleEditTime = (item: TodoItem) => {
    if (!item.completed) return;

    setEditingTodo(item);
    setEditStartTime(item.startedAt ? new Date(item.startedAt) : new Date());
    setEditEndTime(item.completedAt ? new Date(item.completedAt) : new Date());
  };

  const handleEditTaskName = (item: TodoItem) => {
    setEditingTaskName(item);
    setEditTaskName(item.text);
  };

  const handleSaveTaskName = () => {
    if (!editingTaskName) return;

    const updatedTodo = {
      ...editingTaskName,
      text: editTaskName.trim(),
    };

    updateTodo(updatedTodo);
    setEditingTaskName(null);
    setEditTaskName('');
  };

  const handleSaveTimeEdit = () => {
    if (!editingTodo || !editStartTime || !editEndTime) return;

    const updatedTodo = {
      ...editingTodo,
      startedAt: editStartTime,
      completedAt: editEndTime,
    };

    // Calculate duration from start and end time
    const durationMs = editEndTime.getTime() - editStartTime.getTime();
    updatedTodo.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes

    updateTodo(updatedTodo);
    setEditingTodo(null);
    setEditStartTime(null);
    setEditEndTime(null);
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTodoFromContext(id),
        },
      ]
    );
  };

  const completedCount = filteredTodos.filter(todo => todo.completed).length;
  const totalCount = filteredTodos.length;

  const renderTodoItem = ({ item }: { item: TodoItem }) => (
    <View style={[
      styles.todoItem,
      { backgroundColor: colors.surface },
      item.completed && styles.todoItemCompleted,
      item.tag && { borderLeftWidth: 4, borderLeftColor: item.tag.color }
    ]}>
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => {
          if (item.completed) {
            // 已完成任务：点击可以编辑时间或任务名称
            handleEditTime(item);
          } else {
            handleToggleTodo(item.id);
          }
        }}
      >
        <TouchableOpacity
          onPress={() => handleToggleTodo(item.id)}
          style={styles.checkboxContainer}
        >
          <View style={[
            styles.checkbox,
            { borderColor: colors.primary },
            item.completed && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}>
            {item.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>
        <View style={styles.todoTextContainer}>
          <Text style={[
            styles.todoText,
            { color: colors.text },
            item.completed && { textDecorationLine: 'line-through', color: colors.textSecondary }
          ]}>
            {item.text}
          </Text>
          {item.tag && (
            <View style={[styles.tagBadge, { backgroundColor: item.tag.color + '20' }]}>
              <View style={[styles.tagColorDot, { backgroundColor: item.tag.color }]} />
              <Text style={[styles.tagBadgeText, { color: item.tag.color }]}>
                {item.tag.name}
              </Text>
            </View>
          )}
          {/* Calculate and display duration from start and end time */}
          {(() => {
            // Calculate duration from startedAt and completedAt if available
            let displayDuration: number | undefined = item.duration;
            if (!displayDuration && item.startedAt && item.completedAt) {
              const durationMs = new Date(item.completedAt).getTime() - new Date(item.startedAt).getTime();
              const durationSeconds = Math.floor(durationMs / 1000);
              displayDuration = durationSeconds < 60 ? durationSeconds / 60 : Math.floor(durationSeconds / 60);
            }

            // Display duration if available (for both completed and uncompleted tasks)
            return displayDuration !== undefined && displayDuration > 0 ? (
              <Text style={[styles.durationInfo, { color: colors.primary }]}>
                Duration: {displayDuration < 1 ? `${Math.round(displayDuration * 60)}s` : `${displayDuration} min`}
              </Text>
            ) : null;
          })()}
          {item.startedAt && item.completedAt && (
            <Text style={[styles.timeInfo, { color: colors.textSecondary }]}>
              {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        {item.completed && (
          <TouchableOpacity
            style={styles.editNameButton}
            onPress={() => handleEditTaskName(item)}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.timerButton}
        onPress={() => router.push({
          pathname: '/timer',
          params: { taskId: item.id, taskText: item.text }
        })}
      >
        <Ionicons name="time-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTodo(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  const todayCompletedTasks = todos.filter(todo => {
    if (!todo.completed || !todo.completedAt) return false;
    const completedDate = new Date(todo.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  });

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {selectedDate.toDateString() === new Date().toDateString()
                ? t('today')
                : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('of_completed', { count: `${completedCount}/${totalCount}` })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addIconButton}
            onPress={() => router.push('/add-task')}
          >
            <Ionicons name="add" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <CalendarHorizontal onDateSelect={setSelectedDate} />

        <FlatList
          data={filteredTodos}
          renderItem={renderTodoItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>{t('no_tasks_yet')}</Text>
              <Text style={styles.emptySubtext}>{t('add_task_to_get_started')}</Text>
            </View>
          }
          ListFooterComponent={
            (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);

              const selectedDateNormalized = new Date(selectedDate);
              selectedDateNormalized.setHours(0, 0, 0, 0);

              // Only show review link for today or past dates, not for tomorrow or future
              if (selectedDateNormalized >= tomorrow) {
                return null;
              }

              const isToday = selectedDateNormalized.getTime() === today.getTime();
              return (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => router.push({
                    pathname: '/review',
                    params: { date: selectedDate.toISOString() }
                  })}
                >
                  <Text style={[styles.reviewButtonText, { color: colors.primary }]}>
                    {isToday ? t('check_today_review') : t('check_review')}
                  </Text>
                </TouchableOpacity>
              );
            })()
          }
        />

        {/* Edit Time Modal */}
        <Modal
          visible={editingTodo !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingTodo(null)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setEditingTodo(null)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Time</Text>
                <View style={{ width: 24 }} />
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{editingTodo?.text}</Text>

              <View style={styles.timeInputContainer}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>Start Time</Text>
                {editStartTime && (
                  <DateTimePicker
                    value={editStartTime}
                    onChange={setEditStartTime}
                    mode="datetime"
                  />
                )}
              </View>

              <View style={styles.timeInputContainer}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>End Time</Text>
                {editEndTime && (
                  <DateTimePicker
                    value={editEndTime}
                    onChange={setEditEndTime}
                    mode="datetime"
                  />
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                  onPress={() => setEditingTodo(null)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveTimeEdit}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Coin Reward Animation */}
        <CoinRewardToast
          visible={showCoinReward}
          amount={coinRewardAmount}
          message={t('task_completed')}
          onHide={() => setShowCoinReward(false)}
        />
      </SafeAreaView>
    </ThemedBackground>
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  addIconButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todoItemCompleted: {
    opacity: 0.6,
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoTextContainer: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    // 会被动态样式覆盖
  },
  todoText: {
    flex: 1,
    fontSize: 16,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    // 颜色会被动态样式覆盖
  },
  timerButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  tagColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '500',
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
  reviewButton: {
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 14,
    color: '#007AFF', // 会被动态样式覆盖
    fontWeight: '500',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  timeInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  durationInfo: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  editNameButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  modalContent: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalContentContainer: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  timeInputContainer: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  saveButton: {
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});