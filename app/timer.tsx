import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useTodos } from '@/contexts/TodoContext';
import { useUser } from '@/contexts/UserContext';
import { Platform } from 'react-native';

const API_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : 'http://your-server-ip:3000';

export default function TimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { todos, loadTodos } = useTodos();
  const { currentUser } = useUser();
  
  const taskId = params?.taskId as string;
  const [taskText, setTaskText] = useState(params?.taskText as string || 'Flow');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskText, setEditTaskText] = useState(taskText);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const startTimer = async () => {
    const now = new Date();
    if (!startTime) {
      setStartTime(now);
      
      // Immediately save start time to database
      if (taskId && currentUser) {
        try {
          const response = await fetch(`${API_URL}/api/todos/${taskId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              startedAt: now,
              userId: currentUser,
            }),
          });
          
          if (response.ok) {
            await loadTodos();
          }
        } catch (error) {
          console.error('Error saving start time:', error);
        }
      }
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsPaused(false);
    setIsRunning(true);
  };

  const stopTimer = async () => {
    if (elapsedSeconds === 0) {
      // Reset timer if no time elapsed
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedSeconds(0);
      setIsRunning(false);
      setIsPaused(false);
      setStartTime(null);
      return;
    }

    const task = todos.find(t => t.id === taskId);
    const taskName = task?.text || 'this task';
    
    // Calculate duration from start time and end time
    const now = new Date();
    const startedAt = startTime || new Date(now.getTime() - elapsedSeconds * 1000);
    const durationMs = now.getTime() - startedAt.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);
    // Save duration as seconds/60 (decimal) for durations less than 1 minute
    const durationMinutes = durationSeconds < 60 ? durationSeconds / 60 : Math.floor(durationSeconds / 60);
    const displaySeconds = durationSeconds % 60;

    Alert.alert(
      'Stop Timer',
      `Task duration: ${durationSeconds < 60 ? `${durationSeconds}s` : `${durationMinutes}m ${displaySeconds}s`}\n\nIs task "${taskName}" completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Not Completed',
          style: 'default',
          onPress: async () => {
            // Save duration but don't mark as completed
            if (taskId && currentUser) {
              try {
                // Calculate duration from start time and end time
                const endTime = new Date();
                const startTimeValue = startTime || new Date(endTime.getTime() - elapsedSeconds * 1000);
                const durationMs = endTime.getTime() - startTimeValue.getTime();
                const calculatedDurationSeconds = Math.floor(durationMs / 1000);
                const calculatedDurationMinutes = calculatedDurationSeconds < 60 
                  ? calculatedDurationSeconds / 60 
                  : Math.floor(calculatedDurationSeconds / 60);
                
                const response = await fetch(`${API_URL}/api/todos/${taskId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    duration: calculatedDurationMinutes,
                    startedAt: startTimeValue, // Use the start time recorded when timer started
                    completedAt: endTime, // Record end time but don't mark as completed
                    completed: false,
                    userId: currentUser,
                  }),
                });
                
                if (response.ok) {
                  await loadTodos();
                }
              } catch (error) {
                console.error('Error saving duration:', error);
              }
            }
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setElapsedSeconds(0);
            setIsRunning(false);
            setIsPaused(false);
            setStartTime(null);
          },
        },
        {
          text: 'Completed',
          style: 'default',
          onPress: async () => {
            // Save duration and mark as completed
            if (taskId && currentUser) {
              try {
                // Calculate duration from start time and end time
                const endTime = new Date();
                const startTimeValue = startTime || new Date(endTime.getTime() - elapsedSeconds * 1000);
                const durationMs = endTime.getTime() - startTimeValue.getTime();
                const calculatedDurationSeconds = Math.floor(durationMs / 1000);
                const calculatedDurationMinutes = calculatedDurationSeconds < 60 
                  ? calculatedDurationSeconds / 60 
                  : Math.floor(calculatedDurationSeconds / 60);
                
                const response = await fetch(`${API_URL}/api/todos/${taskId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    duration: calculatedDurationMinutes,
                    startedAt: startTimeValue, // Use the start time recorded when timer started
                    completedAt: endTime,
                    completed: true,
                    userId: currentUser,
                  }),
                });
                
                if (response.ok) {
                  await loadTodos();
                }
              } catch (error) {
                console.error('Error saving duration:', error);
              }
            }
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setElapsedSeconds(0);
            setIsRunning(false);
            setIsPaused(false);
            setStartTime(null);
          },
        },
      ]
    );
  };

  const saveTaskEdit = () => {
    setTaskText(editTaskText);
    setIsEditingTask(false);
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds };
  };

  const { minutes, seconds } = formatTime(elapsedSeconds);

  // 计算进度（基于1分钟，即60秒，进度条一分钟转一圈）
  const maxSeconds = 60; // 1分钟
  const progress = (elapsedSeconds % maxSeconds) / maxSeconds; // 使用模运算，每60秒重置
  const angle = progress * 360; // 转换为角度

  const backgroundColor = isDark ? '#1C1C1E' : '#F2F2F7';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? '#8E8E93' : '#6E6E73';
  const circleColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const accentColor = '#FF9500'; // 橙色

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>专注中</Text>
        <TouchableOpacity style={styles.muteButton}>
          <Ionicons name="volume-mute" size={20} color={secondaryTextColor} />
        </TouchableOpacity>
      </View>

      {/* Task Name */}
      <View style={styles.taskNameContainer}>
        <TouchableOpacity
          style={styles.taskNameRow}
          onPress={() => {
            setEditTaskText(taskText);
            setIsEditingTask(true);
          }}
        >
          <Text style={[styles.taskName, { color: textColor }]}>{taskText}</Text>
          <Ionicons name="pencil" size={16} color={secondaryTextColor} style={styles.editIcon} />
        </TouchableOpacity>
      </View>

      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        <View style={styles.timerCircleWrapper}>
          {/* Background circle */}
          <View style={[styles.timerCircle, { borderColor: circleColor }]} />
          {/* Progress arc - using two half circles */}
          {progress > 0 && (
            <>
              {progress <= 0.5 ? (
                <View
                  style={[
                    styles.progressArcHalf,
                    styles.progressArcRight,
                    {
                      borderColor: accentColor,
                      transform: [{ rotate: `${angle - 90}deg` }],
                    },
                  ]}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.progressArcHalf,
                      styles.progressArcRight,
                      {
                        borderColor: accentColor,
                        transform: [{ rotate: '90deg' }],
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressArcHalf,
                      styles.progressArcLeft,
                      {
                        borderColor: accentColor,
                        transform: [{ rotate: `${angle - 270}deg` }],
                      },
                    ]}
                  />
                </>
              )}
            </>
          )}
          <View style={styles.timerContent}>
            <Text style={[styles.timeDisplay, { color: textColor }]}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: circleColor }]}
          onPress={() => {
            setEditTaskText(taskText);
            setIsEditingTask(true);
          }}
        >
          <Ionicons name="pencil-outline" size={24} color={textColor} />
        </TouchableOpacity>

        {!isRunning && !isPaused && (
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton, { backgroundColor: secondaryTextColor }]}
            onPress={startTimer}
          >
            <Ionicons name="play" size={24} color={backgroundColor} />
          </TouchableOpacity>
        )}

        {isRunning && !isPaused && (
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton, { backgroundColor: secondaryTextColor }]}
            onPress={pauseTimer}
          >
            <Ionicons name="pause" size={24} color={backgroundColor} />
          </TouchableOpacity>
        )}

        {isPaused && (
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton, { backgroundColor: secondaryTextColor }]}
            onPress={resumeTimer}
          >
            <Ionicons name="play" size={24} color={backgroundColor} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: circleColor }]}
          onPress={stopTimer}
        >
          <Ionicons name="stop" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Edit Task Modal */}
      <Modal
        visible={isEditingTask}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingTask(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>编辑任务名称</Text>
            <TextInput
              style={[styles.modalInput, { color: textColor, borderColor: secondaryTextColor }]}
              value={editTaskText}
              onChangeText={setEditTaskText}
              placeholder="输入任务名称"
              placeholderTextColor={secondaryTextColor}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: circleColor }]}
                onPress={() => setIsEditingTask(false)}
              >
                <Text style={[styles.modalButtonText, { color: textColor }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: accentColor }]}
                onPress={saveTaskEdit}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  muteButton: {
    padding: 8,
  },
  taskNameContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'flex-start',
  },
  taskNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 20,
    fontWeight: '600',
  },
  editIcon: {
    marginLeft: 8,
  },
  taskSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  timerCircleWrapper: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
  },
  progressArcHalf: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
  },
  progressArcRight: {
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  progressArcLeft: {
    borderLeftColor: 'transparent',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  timerContent: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 64,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
