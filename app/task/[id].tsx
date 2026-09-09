import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getGoals,
  Task,
  Goal,
} from '../../lib/db';
import { StatusBadge } from '../../components/StatusBadge';
import { ReflectionModal } from '../../components/ReflectionModal';
import { GoalPickerModal } from '../../components/GoalPickerModal';
import { THEME } from '../../lib/theme';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const taskId = Number(id);

  const [task, setTask] = useState<Task | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalId, setGoalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reflectionModalVisible, setReflectionModalVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [taskData, allGoals] = await Promise.all([
        getTaskById(taskId),
        getGoals(),
      ]);

      if (taskData) {
        setTask(taskData);
        setTitle(taskData.title);
        setDescription(taskData.description || '');
        setGoalId(taskData.goal_id);
      }
      setGoals(allGoals);
    } catch (err) {
      console.error('Ошибка загрузки задачи:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      Alert.alert('Заголовок обязателен', 'Пожалуйста, укажите название задачи.');
      return;
    }

    setSaving(true);
    try {
      await updateTask(taskId, {
        title: title.trim(),
        description: description.trim() || null,
        goal_id: goalId,
      });
      await loadData();
      Alert.alert('Успешно', 'Изменения сохранены.');
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения.');
    } finally {
      setSaving(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleSaveDetails}
          disabled={saving}
          style={({ pressed }) => [styles.headerSaveBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.headerSaveText}>{saving ? '...' : 'Сохранить'}</Text>
        </Pressable>
      ),
    });
  }, [navigation, handleSaveDetails, saving]);

  const handleStart = async () => {
    try {
      await updateTaskStatus(taskId, 'in_progress');
      await loadData();
    } catch (err) {
      console.error('Ошибка смены статуса:', err);
      Alert.alert('Ошибка', 'Не удалось изменить статус');
    }
  };

  const handleCompletePress = () => {
    setReflectionModalVisible(true);
  };

  const handleSaveReflection = async (reflectionText: string) => {
    try {
      await updateTaskStatus(taskId, 'completed', reflectionText || null);
      setReflectionModalVisible(false);
      await loadData();
    } catch (err) {
      console.error('Ошибка сохранения рефлексии:', err);
      Alert.alert('Ошибка', 'Не удалось завершить задачу');
    }
  };

  const handleSkipReflection = async () => {
    try {
      await updateTaskStatus(taskId, 'completed', null);
      setReflectionModalVisible(false);
      await loadData();
    } catch (err) {
      console.error('Ошибка завершения задачи:', err);
      Alert.alert('Ошибка', 'Не удалось завершить задачу');
    }
  };

  const handleReopen = async () => {
    try {
      await updateTaskStatus(taskId, 'in_progress');
      await loadData();
    } catch (err) {
      console.error('Ошибка возврата задачи:', err);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить задачу?',
      'Вы уверены, что хотите удалить эту задачу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              router.back();
            } catch (err) {
              console.error('Ошибка удаления:', err);
              Alert.alert('Ошибка', 'Не удалось удалить задачу');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Задача не найдена</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Вернуться назад</Text>
        </Pressable>
      </View>
    );
  }

  const selectedGoal = goals.find((g) => g.id === goalId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Интерактивный статус-степпер */}
        <View style={styles.stepperCard}>
          <Text style={styles.sectionLabel}>Этап выполнения</Text>
          <View style={styles.stepperRow}>
            {/* Шаг 1 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  task.status === 'not_started' && styles.stepCircleActive,
                  (task.status === 'in_progress' || task.status === 'completed') && styles.stepCircleCompleted,
                ]}
              >
                <Ionicons
                  name={task.status !== 'not_started' ? 'checkmark' : 'radio-button-on'}
                  size={14}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.stepLabel}>Создано</Text>
            </View>

            <View
              style={[
                styles.stepLine,
                task.status !== 'not_started' && styles.stepLineActive,
              ]}
            />

            {/* Шаг 2 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  task.status === 'in_progress' && styles.stepCircleActive,
                  task.status === 'completed' && styles.stepCircleCompleted,
                ]}
              >
                <Ionicons
                  name={task.status === 'completed' ? 'checkmark' : 'play'}
                  size={12}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.stepLabel}>В процессе</Text>
            </View>

            <View
              style={[
                styles.stepLine,
                task.status === 'completed' && styles.stepLineActive,
              ]}
            />

            {/* Шаг 3 */}
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  task.status === 'completed' && styles.stepCircleCompleted,
                ]}
              >
                <Ionicons name="trophy" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabel}>Выполнено</Text>
            </View>
          </View>

          {/* Главная кнопка действия */}
          <View style={styles.actionButtonArea}>
            {task.status === 'not_started' && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.actionBtnStart,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleStart}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Начать выполнение</Text>
              </Pressable>
            )}

            {task.status === 'in_progress' && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.actionBtnComplete,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCompletePress}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Завершить задачу</Text>
              </Pressable>
            )}

            {task.status === 'completed' && (
              <Pressable
                style={({ pressed }) => [
                  styles.reopenBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleReopen}
              >
                <Ionicons name="refresh" size={15} color={THEME.colors.textMuted} />
                <Text style={styles.reopenBtnText}>Вернуть в работу</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Карточка рефлексии Aceternity Quote Style */}
        {task.status === 'completed' && task.reflection ? (
          <View style={styles.reflectionCard}>
            <View style={styles.reflectionHeader}>
              <View style={styles.reflectionIconWrap}>
                <Ionicons name="sparkles" size={16} color={THEME.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reflectionTitle}>Инсайты выполнения</Text>
                {task.completed_at && (
                  <Text style={styles.completedAtDate}>
                    {new Date(task.completed_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.quoteBlock}>
              <Ionicons
                name="chatbubble-ellipses"
                size={18}
                color={THEME.colors.secondary}
                style={styles.quoteIcon}
              />
              <Text style={styles.reflectionText}>{task.reflection}</Text>
            </View>
          </View>
        ) : null}

        {/* Поля формы */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Название задачи</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Название задачи"
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Описание</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Детали и заметки..."
              placeholderTextColor={THEME.colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Связанная цель</Text>
          <Pressable
            style={({ pressed }) => [
              styles.pickerButton,
              pressed && styles.pickerButtonPressed,
            ]}
            onPress={() => setGoalPickerVisible(true)}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name={selectedGoal ? 'flag' : 'flag-outline'}
                size={18}
                color={selectedGoal ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedGoal && styles.pickerPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedGoal ? selectedGoal.title : 'Без цели'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={THEME.colors.textMuted} />
          </Pressable>
        </View>

        {/* Кнопка удаления */}
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color={THEME.colors.destructive} />
          <Text style={styles.deleteButtonText}>Удалить задачу</Text>
        </Pressable>
      </ScrollView>

      <ReflectionModal
        visible={reflectionModalVisible}
        initialValue={task.reflection}
        onSave={handleSaveReflection}
        onSkip={handleSkipReflection}
      />

      <GoalPickerModal
        visible={goalPickerVisible}
        goals={goals}
        selectedGoalId={goalId}
        onSelectGoal={setGoalId}
        onClose={() => setGoalPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: THEME.colors.background,
  },
  notFoundText: {
    fontSize: 17,
    color: THEME.colors.textSecondary,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radii.sm,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  stepperCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.glowIndigo,
  },
  stepCircleCompleted: {
    backgroundColor: THEME.colors.success,
    ...THEME.shadows.glowEmerald,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginBottom: 18,
  },
  stepLineActive: {
    backgroundColor: THEME.colors.primary,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  actionButtonArea: {
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    gap: 8,
  },
  actionBtnStart: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.glowIndigo,
  },
  actionBtnComplete: {
    backgroundColor: THEME.colors.success,
    ...THEME.shadows.glowEmerald,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reopenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  reopenBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  reflectionCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: THEME.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  reflectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.secondary,
  },
  completedAtDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  quoteBlock: {
    position: 'relative',
    paddingLeft: 22,
  },
  quoteIcon: {
    position: 'absolute',
    left: 0,
    top: -2,
    opacity: 0.5,
  },
  reflectionText: {
    fontSize: 15,
    color: THEME.colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  inputCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  textInput: {
    fontSize: 16,
    color: THEME.colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
  },
  pickerButton: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  pickerButtonPressed: {
    backgroundColor: THEME.colors.backgroundSubtle,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: THEME.colors.textMuted,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    gap: 6,
  },
  deleteButtonText: {
    color: THEME.colors.destructive,
    fontSize: 15,
    fontWeight: '600',
  },
});
