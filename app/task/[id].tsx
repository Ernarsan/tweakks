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
import { LinearGradient } from 'expo-linear-gradient';
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
import { Theme } from '../../lib/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { ReflectionModal } from '../../components/ReflectionModal';
import { GoalPickerModal } from '../../components/GoalPickerModal';
import { MotionPressable } from '../../components/MotionPressable';

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

  // Reflection modal
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
      Alert.alert('Заголовок обязателен', 'Пожалуйста, введите название задачи.');
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
        <MotionPressable
          onPress={handleSaveDetails}
          disabled={saving}
          style={styles.headerSaveBtn}
        >
          <Text style={styles.headerSaveText}>{saving ? '...' : 'Сохранить'}</Text>
        </MotionPressable>
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
        <ActivityIndicator size="large" color="#818CF8" />
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
        {/* Верхняя панель статуса */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionLabel}>ТЕКУЩИЙ СТАТУС</Text>
          <StatusBadge status={task.status} />
        </View>

        {/* Кнопки смены статуса */}
        <View style={styles.actionBlock}>
          {task.status === 'not_started' && (
            <MotionPressable onPress={handleStart}>
              <LinearGradient
                colors={Theme.colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryActionButton}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Начать выполнение</Text>
              </LinearGradient>
            </MotionPressable>
          )}

          {task.status === 'in_progress' && (
            <MotionPressable onPress={handleCompletePress}>
              <LinearGradient
                colors={Theme.colors.gradients.success}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryActionButton}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Завершить задачу</Text>
              </LinearGradient>
            </MotionPressable>
          )}

          {task.status === 'completed' && (
            <Pressable
              style={({ pressed }) => [
                styles.reopenButton,
                pressed && { opacity: 0.6 },
              ]}
              onPress={handleReopen}
            >
              <Ionicons name="refresh" size={16} color="#818CF8" />
              <Text style={styles.reopenButtonText}>Вернуть в статус «В процессе»</Text>
            </Pressable>
          )}
        </View>

        {/* Блок рефлексии */}
        {task.status === 'completed' && task.reflection ? (
          <View style={styles.reflectionCard}>
            <View style={styles.reflectionHeader}>
              <Ionicons name="chatbox-ellipses" size={18} color="#818CF8" />
              <Text style={styles.reflectionTitle}>Рефлексия после завершения</Text>
            </View>
            <Text style={styles.reflectionContent}>{task.reflection}</Text>
            {task.completed_at && (
              <Text style={styles.completedAtText}>
                Завершено: {new Date(task.completed_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        ) : null}

        {/* Редактируемые поля */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>НАЗВАНИЕ ЗАДАЧИ</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Название задачи"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ОПИСАНИЕ</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Дополнительные детали..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ПРИВЯЗАННАЯ ЦЕЛЬ</Text>
          <MotionPressable
            style={styles.pickerButton}
            onPress={() => setGoalPickerVisible(true)}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name={selectedGoal ? 'flag' : 'flag-outline'}
                size={18}
                color={selectedGoal ? '#818CF8' : '#64748B'}
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
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </MotionPressable>
        </View>

        {/* Кнопка удаления */}
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Удалить задачу</Text>
        </Pressable>
      </ScrollView>

      {/* Модальное окно рефлексии */}
      <ReflectionModal
        visible={reflectionModalVisible}
        initialValue={task.reflection}
        onSave={handleSaveReflection}
        onSkip={handleSkipReflection}
      />

      {/* Модалка выбора цели */}
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
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0B0F19',
  },
  notFoundText: {
    fontSize: 17,
    color: '#94A3B8',
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: '#232E48',
  },
  backBtnText: {
    color: '#818CF8',
    fontWeight: '600',
  },
  headerSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#818CF8',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131B2E',
    padding: 16,
    borderRadius: Theme.radii.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#232E48',
  },
  actionBlock: {
    marginBottom: 16,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Theme.radii.lg,
    gap: 8,
    ...Theme.shadows.glowPrimary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reopenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  reopenButtonText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '600',
  },
  reflectionCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: Theme.radii.lg,
    padding: 18,
    marginBottom: 20,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 0.2,
  },
  reflectionContent: {
    fontSize: 15,
    color: '#F8FAFC',
    lineHeight: 22,
  },
  completedAtText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputCard: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#232E48',
  },
  textInput: {
    fontSize: 16,
    color: '#F8FAFC',
  },
  textArea: {
    minHeight: 80,
  },
  pickerButton: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#232E48',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  pickerPlaceholder: {
    color: '#64748B',
    fontWeight: '400',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 10,
    gap: 6,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
