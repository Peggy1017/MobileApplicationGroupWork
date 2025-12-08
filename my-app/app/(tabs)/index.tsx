import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem } from '@/types/todo';
import { useTodos } from '@/contexts/TodoContext';
import CalendarHorizontal from '@/components/calendar-horizontal';
import DateTimePicker from '@/components/date-time-picker';

export default function TodayScreen() {
  const router = useRouter();
  const { todos, toggleTodo, deleteTodo: deleteTodoFromContext, updateTodo } = useTodos();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [editStartTime, setEditStartTime] = useState<Date | null>(null);
  const [editEndTime, setEditEndTime] = useState<Date | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<TodoItem | null>(null);
  const [editTaskName, setEditTaskName] = useState('');

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

  const handleToggleTodo = (id: string) => {
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
    }
  };

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
          <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
            {item.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>
        <View style={styles.todoTextContainer}>
          <Text style={[styles.todoText, item.completed && styles.todoTextCompleted]}>
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
              <Text style={styles.durationInfo}>
                Duration: {displayDuration < 1 ? `${Math.round(displayDuration * 60)}s` : `${displayDuration} min`}
              </Text>
            ) : null;
          })()}
          {item.startedAt && item.completedAt && (
            <Text style={styles.timeInfo}>
              {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        {item.completed && (
          <TouchableOpacity
            style={styles.editNameButton}
            onPress={() => handleEditTaskName(item)}
          >
            <Ionicons name="pencil-outline" size={18} color="#007AFF" />
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
        <Ionicons name="time-outline" size={20} color="#007AFF" />
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {selectedDate.toDateString() === new Date().toDateString() 
              ? 'Today' 
              : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`}
          </Text>
          <Text style={styles.subtitle}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addIconButton}
          onPress={() => router.push('/add-task')}
        >
          <Ionicons name="add" size={28} color="#007AFF" />
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
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Add a task to get started</Text>
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
                <Text style={styles.reviewButtonText}>
                  {isToday ? 'check today review >' : 'check review >'}
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
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>Edit Time</Text>
            <Text style={styles.modalSubtitle}>{editingTodo?.text}</Text>

            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>Start Time</Text>
              {editStartTime && (
                <DateTimePicker
                  value={editStartTime}
                  onChange={setEditStartTime}
                  mode="datetime"
                />
              )}
            </View>

            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>End Time</Text>
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
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingTodo(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTimeEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
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
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
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
  addIconButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
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
    color: '#007AFF',
    fontWeight: '500',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  timeInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  durationInfo: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  editNameButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalContentContainer: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  timeInputContainer: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});