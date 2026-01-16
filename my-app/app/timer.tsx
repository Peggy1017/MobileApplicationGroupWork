import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, AppState, AppStateStatus, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useTodos } from '@/contexts/TodoContext';
import { useUser } from '@/contexts/UserContext';
import { useCoins } from '@/contexts/CoinContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import CoinRewardToast from '@/components/CoinRewardToast';
import ThemedBackground from '@/components/ThemedBackground';

import Svg, { Circle, Line, G } from 'react-native-svg';

const API_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000'
  : 'http://your-server-ip:3000';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.85;
const CENTER = TIMER_SIZE / 2;
const RADIUS = TIMER_SIZE / 2 - 20;

export default function TimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDarkMode } = useTheme();
  const { todos, loadTodos } = useTodos();
  const { currentUser, isLoggedIn } = useUser();
  const { rewardCoins, currentThemeData } = useCoins();
  const { showFocusCompleteNotification } = useNotifications();
  const { t } = useLanguage();
  const isDark = isDarkMode;

  // Coin reward state
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [coinRewardAmount, setCoinRewardAmount] = useState(0);

  const taskId = params?.taskId as string;
  const [taskText, setTaskText] = useState(params?.taskText as string || 'Flow');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskText, setEditTaskText] = useState(taskText);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const pauseStartTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const calculateElapsedSeconds = useCallback(() => {
    if (!startTime) return 0;
    const now = new Date();
    const totalMs = now.getTime() - startTime.getTime();
    return Math.floor(totalMs / 1000);
  }, [startTime]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isRunning && !isPaused && startTime) {
          const actualElapsed = calculateElapsedSeconds();
          setElapsedSeconds(actualElapsed);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, [isRunning, isPaused, startTime, calculateElapsedSeconds]);

  useEffect(() => {
    if (isRunning && !isPaused && startTime) {
      intervalRef.current = setInterval(() => {
        const actualElapsed = calculateElapsedSeconds();
        setElapsedSeconds(actualElapsed);
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
  }, [isRunning, isPaused, startTime, calculateElapsedSeconds]);

  const startTimer = async () => {
    const now = new Date();
    if (!startTime) {
      setStartTime(now);
      if (taskId && currentUser) {
        try {
          const response = await fetch(`${API_URL}/api/todos/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startedAt: now, userId: currentUser }),
          });
          if (response.ok) await loadTodos();
        } catch (error) { console.error('Error saving start time:', error); }
      }
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    pauseStartTimeRef.current = new Date();
    setIsPaused(true);
    setIsRunning(false);
  };

  const resumeTimer = () => {
    if (pauseStartTimeRef.current && startTime) {
      const pauseDuration = new Date().getTime() - pauseStartTimeRef.current.getTime();
      setStartTime(new Date(startTime.getTime() + pauseDuration));
      pauseStartTimeRef.current = null;
    }
    setIsPaused(false);
    setIsRunning(true);
  };

  const stopTimer = async () => {
    if (elapsedSeconds === 0) {
      resetTimerState();
      return;
    }

    const task = todos.find(t => t.id === taskId);
    const taskName = task?.text || 'this task';
    const durationSeconds = elapsedSeconds;
    const durationMinutes = durationSeconds < 60 ? durationSeconds / 60 : Math.floor(durationSeconds / 60);
    const displaySeconds = durationSeconds % 60;
    const displayMinutes = Math.floor(durationSeconds / 60);

    // 格式化时长显示
    const durationText = displayMinutes > 0 
      ? `${displayMinutes}${t('minutes')} ${displaySeconds}${t('seconds')}`
      : `${durationSeconds}${t('seconds')}`;
    
    Alert.alert(
      t('stop_timer'),
      `${t('task_duration')}: ${durationText}\n\n${t('is_task_completed', { taskName })}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('not_completed'),
          style: 'default',
          onPress: async () => {
            await saveDuration(durationMinutes, false);
            resetTimerState();
          },
        },
        {
          text: t('completed'),
          style: 'default',
          onPress: async () => {
            await saveDuration(durationMinutes, true);

            // Reward coins (focus session complete)
            if (isLoggedIn && durationMinutes >= 1) {
              try {
                await rewardCoins('FOCUS_SESSION');
                setCoinRewardAmount(10);
                setShowCoinReward(true);
                // Send focus completion notification
                await showFocusCompleteNotification(taskName, durationMinutes);
              } catch (error) {
                console.error('Failed to reward coins:', error);
              }
            }

            resetTimerState();
          },
        },
      ]
    );
  };

  const saveDuration = async (durationMinutes: number, completed: boolean) => {
    if (!taskId || !currentUser) {
      console.warn('Cannot save duration: taskId or currentUser is missing', { taskId, currentUser });
      Alert.alert(t('error'), t('please_login_first'));
      return;
    }

    try {
      const endTime = new Date();
      const updateData: any = {
        duration: durationMinutes,
        startedAt: startTime,
        completedAt: endTime, // 无论是否完成，都保存 completedAt，这样可以在 review 中显示
        completed,
        userId: currentUser,
      };

      const response = await fetch(`${API_URL}/api/todos/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await loadTodos();
        console.log('Duration saved successfully:', { durationMinutes, completed, endTime });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save duration:', errorData);
        Alert.alert(t('error'), errorData.error || t('failed_to_save_task'));
      }
    } catch (error) {
      console.error('Error saving duration:', error);
      Alert.alert(t('error'), t('failed_to_save_task'));
    }
  };

  const resetTimerState = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    pauseStartTimeRef.current = null;
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

  // Visualization constants
  const maxSeconds = 60;
  const progress = (elapsedSeconds % maxSeconds) / maxSeconds;
  const angle = progress * 360;

  const backgroundColor = colors.background;
  const textColor = colors.text;
  const secondaryTextColor = colors.textSecondary;
  const circleColor = colors.surface;
  const accentColor = colors.primary;
  const tickColor = colors.border;

  // Generate ticks
  const ticks = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const isHour = i % 5 === 0;
      return { index: i, isHour };
    });
  }, []);

  return (
    <ThemedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: currentThemeData && !currentThemeData.isDefault ? 'transparent' : backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-down" size={24} color={textColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => { setEditTaskText(taskText); setIsEditingTask(true); }}
          >
            <Text style={[styles.headerTitle, { color: textColor }]}>{taskText}</Text>
            <Ionicons name="pencil" size={14} color={secondaryTextColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.muteButton}>
            <Ionicons name="volume-mute" size={20} color={secondaryTextColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.timerWrapper}>
            <Svg width={TIMER_SIZE} height={TIMER_SIZE} viewBox={`0 0 ${TIMER_SIZE} ${TIMER_SIZE}`}>
              {/* Ticks */}
              {ticks.map(({ index, isHour }) => {
                const rotation = index * 6;
                return (
                  <Line
                    key={index}
                    x1={CENTER}
                    y1={20} // Outer edge
                    x2={CENTER}
                    y2={isHour ? 35 : 25} // Inner edge
                    stroke={tickColor}
                    strokeWidth={isHour ? 2 : 1.5}
                    transform={`rotate(${rotation}, ${CENTER}, ${CENTER})`}
                  />
                );
              })}

              {/* Main Progress Circle (Thin Orange Line) */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={accentColor}
                strokeWidth="1.5"
                fill="none"
                strokeDasharray={`${2 * Math.PI * RADIUS}`}
                strokeDashoffset={2 * Math.PI * RADIUS * (1 - progress)}
                rotation="-90"
                origin={`${CENTER}, ${CENTER}`}
                strokeLinecap="round"
              />

              {/* Pointer / Indicator */}
              <G rotation={angle} origin={`${CENTER}, ${CENTER}`}>
                {/* Line pointing from center to edge */}
                <Line
                  x1={CENTER}
                  y1={CENTER}
                  x2={CENTER}
                  y2={35} // Just below ticks
                  stroke={accentColor}
                  strokeWidth="2"
                />
                {/* Small dot at the end of pointer */}
                <Circle cx={CENTER} cy={35} r={3} fill={accentColor} />
              </G>
            </Svg>

            {/* Digital Time Display (Centered) */}
            <View style={styles.centerTextContainer}>
              <View style={styles.timeRow}>
                <Text style={[styles.timeValue, { color: textColor }]}>
                  {minutes.toString().padStart(2, '0')}
                </Text>
                <Text style={[styles.timeValue, { color: textColor, marginHorizontal: 10 }]}>
                  {seconds.toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.labelsRow}>
                <Text style={[styles.timeLabel, { color: secondaryTextColor }]}>
                  {t('minutes')}
                </Text>
                <View style={{ width: 40 }} />
                <Text style={[styles.timeLabel, { color: secondaryTextColor }]}>
                  {t('seconds')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          {!isRunning && !isPaused && (
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.surface, shadowColor: colors.text }]}
              onPress={startTimer}
            >
              <Ionicons name="play" size={40} color={accentColor} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}

          {isRunning && !isPaused && (
            <View style={styles.runningControls}>
              <TouchableOpacity
                style={[styles.smallControlBtn, { backgroundColor: colors.surface }]}
                onPress={() => { setEditTaskText(taskText); setIsEditingTask(true); }}
              >
                <Ionicons name="create-outline" size={24} color={accentColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.surface, shadowColor: colors.text }]}
                onPress={pauseTimer}
              >
                <Ionicons name="pause" size={40} color={accentColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallControlBtn, { backgroundColor: colors.surface }]}
                onPress={stopTimer}
              >
                <Ionicons name="stop" size={24} color={accentColor} />
              </TouchableOpacity>
            </View>
          )}

          {isPaused && (
            <View style={styles.runningControls}>
              <TouchableOpacity
                style={[styles.smallControlBtn, { backgroundColor: colors.surface }]}
                onPress={() => { setEditTaskText(taskText); setIsEditingTask(true); }}
              >
                <Ionicons name="create-outline" size={24} color={textColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.surface, shadowColor: colors.text }]}
                onPress={resumeTimer}
              >
                <Ionicons name="play" size={40} color={accentColor} style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallControlBtn, { backgroundColor: colors.surface }]}
                onPress={stopTimer}
              >
                <Ionicons name="stop" size={24} color={accentColor} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Edit Task Modal */}
        <Modal
          visible={isEditingTask}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditingTask(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsEditingTask(false)}
                >
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: textColor }]}>{t('edit_task_name')}</Text>
                <View style={{ width: 24 }} />
              </View>
              <TextInput
                style={[styles.modalInput, { color: textColor, borderColor: colors.border, backgroundColor: colors.background }]}
                value={editTaskText}
                onChangeText={setEditTaskText}
                placeholder={t('enter_task_name')}
                placeholderTextColor={secondaryTextColor}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setIsEditingTask(false)}
                >
                  <Text style={[styles.modalButtonText, { color: textColor }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: accentColor }]}
                  onPress={saveTaskEdit}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Coin Reward Animation */}
        <CoinRewardToast
          visible={showCoinReward}
          amount={coinRewardAmount}
          message={t('focus_completed')}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  muteButton: {
    padding: 8,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerWrapper: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 60,
    textAlign: 'center',
  },
  controls: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  runningControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  smallControlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
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
