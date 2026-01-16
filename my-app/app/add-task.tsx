import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem, Tag } from '@/types/todo';
import TagSelector from '@/components/tag-selector';
import { useTodos } from '@/contexts/TodoContext';
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import DateTimePicker from '@/components/date-time-picker';
import ThemedBackground from '@/components/ThemedBackground';

export default function AddTaskScreen() {
  const router = useRouter();
  const { addTodo } = useTodos();
  const { isLoggedIn, currentUser } = useUser();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [taskName, setTaskName] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<number>(4); // 默认中等优先级
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const priorityOptions = [
    { value: 1, label: t('priority_urgent'), color: '#FF3B30' },
    { value: 2, label: t('priority_high'), color: '#FF9500' },
    { value: 3, label: t('priority_medium'), color: '#FFCC00' },
    { value: 4, label: t('priority_low'), color: '#34C759' },
  ];

  const handleSave = async () => {
    if (!isLoggedIn || !currentUser) {
      Alert.alert(t('error'), t('please_login_first'));
      return;
    }

    if (taskName.trim() === '') {
      Alert.alert(t('error'), t('please_enter_task_name'));
      return;
    }

    const newTodo: TodoItem = {
      id: Date.now().toString(), // 临时ID，后端会返回真实ID
      text: taskName.trim(),
      completed: false,
      createdAt: selectedDate, // 使用选择的日期
      tag: selectedTag || undefined,
      priority: selectedPriority,
      notes: notes.trim() || undefined,
    };

    try {
      await addTodo(newTodo);
      router.back();
    } catch {
      Alert.alert(t('error'), t('failed_to_save_task'));
    }
  };

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('add_task')}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { color: colors.primary }]}>{t('save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('task_name')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={t('enter_task_name')}
              placeholderTextColor={colors.textSecondary}
              value={taskName}
              onChangeText={setTaskName}
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('date')}</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('tag')}</Text>
            <TagSelector
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('priority')}</Text>
            <View style={styles.priorityPicker}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.priorityOption,
                    { backgroundColor: colors.surface, borderColor: option.color },
                    selectedPriority === option.value && {
                      backgroundColor: option.color + '20',
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedPriority(option.value)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                  <Text style={[
                    styles.priorityText,
                    { color: colors.text },
                    selectedPriority === option.value && { color: option.color, fontWeight: '600' }
                  ]}>
                    {option.label}
                  </Text>
                  {selectedPriority === option.value && (
                    <Ionicons name="checkmark" size={16} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('notes')}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={t('add_notes')}
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('select_date')}</Text>
              <DateTimePicker
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setShowDatePicker(false);
                }}
                mode="date"
              />
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCloseButtonText}>{t('close')}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  priorityPicker: {
    gap: 12,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityText: {
    flex: 1,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

