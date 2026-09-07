import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getGoalById,
  updateGoal,
  addGoalProgress,
  deleteGoal,
  getTasksByGoalId,
  Goal,
  Task,
} from '../../lib/db';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import { Theme } from '../../lib/theme';
import { MotionPressable } from '../../components/MotionPressable';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const goalId = Number(id);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Progress add modal
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progressDelta, setProgressDelta] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [goalData, linkedTasks] = await Promise.all([
        getGoalById(goalId),
        getTasksByGoalId(goalId),
      ]);

      if (goalData) {
        setGoal(goalData);
        setTitle(goalData.title);
        setTargetValue(goalData.target_value.toString());
        setUnit(goalData.unit || '');
        setDeadline(goalData.deadline || '');
      }
      setTasks(linkedTasks);
    } catch (err) {
      console.error('Ошибка загрузки цели:', err);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      Alert.alert('Заголовок обязателен', 'Пожалуйста, укажите название цели.');
      return;
    }

    const numTarget = parseFloat(targetValue.replace(',', '.'));
    if (isNaN(numTarget) || numTarget <= 0) {
      Alert.alert('Некорректная цель', 'Укажите положительное числовое значение цели.');
      return;
    }

    setSaving(true);
    try {
      await updateGoal(goalId, {
        title: title.trim(),
        target_value: numTarget,
        unit: unit.trim() || null,
        deadline: deadline.trim() || null,
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

  const handleAddProgress = async () => {
    const delta = parseFloat(progressDelta.replace(',', '.'));
    if (isNaN(delta) || delta <= 0) {
      Alert.alert('Некорректная сумма', 'Введите положительное число для добавления прогресса.');
      return;
    }

    try {
      await addGoalProgress(goalId, delta);
      setProgressModalVisible(false);
      setProgressDelta('');
      await loadData();
    } catch (err) {
      console.error('Ошибка добавления прогресса:', err);
      Alert.alert('Ошибка', 'Не удалось обновить прогресс');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить цель?',
      'Связанные задачи не удалятся, но потеряют привязку к этой цели.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goalId);
              router.back();
            } catch (err) {
              console.error('Ошибка удаления цели:', err);
              Alert.alert('Ошибка', 'Не удалось удалить цель');
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

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Цель не найдена</Text>
        <MotionPressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Вернуться назад</Text>
        </MotionPressable>
      </View>
    );
  }

  const percent = Math.min(
    Math.round((goal.current_value / (goal.target_value || 1)) * 100),
    100
  );
  const unitStr = goal.unit ? ` ${goal.unit}` : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Карточка текущего прогресса (Bento style) */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressCardTitle}>ТЕКУЩИЙ ПРОГРЕСС</Text>
            <View style={styles.percentBadge}>
              <Text style={styles.percentBadgeText}>{percent}%</Text>
            </View>
          </View>

          <ProgressBar
            current={goal.current_value}
            target={goal.target_value}
            height={10}
            style={styles.progressBar}
          />

          <View style={styles.progressValues}>
            <Text style={styles.currentValueText}>
              {goal.current_value}
              <Text style={styles.subText}> / {goal.target_value}{unitStr}</Text>
            </Text>
          </View>

          {/* Кнопка «+ добавить прогресс» */}
          <MotionPressable
            onPress={() => setProgressModalVisible(true)}
            style={styles.addProgressBtnContainer}
          >
            <LinearGradient
              colors={Theme.colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addProgressBtn}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addProgressBtnText}>+ добавить прогресс</Text>
            </LinearGradient>
          </MotionPressable>
        </View>

        {/* Редактируемые поля */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>НАЗВАНИЕ ЦЕЛИ</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Название цели"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ЦЕЛЕВОЕ ЗНАЧЕНИЕ</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="decimal-pad"
              placeholder="Целевое значение"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ЕДИНИЦА ИЗМЕРЕНИЯ</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={unit}
              onChangeText={setUnit}
              placeholder="₽, км, книг и т.д."
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>СРОК / ДЕДЛАЙН</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="Например, 31.12.2025"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Список связанных задач */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            СВЯЗАННЫЕ ЗАДАЧИ ({tasks.length})
          </Text>
          {tasks.length === 0 ? (
            <View style={styles.emptyTasksBox}>
              <Ionicons name="documents-outline" size={24} color="#64748B" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyTasksText}>К этой цели пока не привязано задач</Text>
            </View>
          ) : (
            tasks.map((t) => (
              <MotionPressable
                key={t.id}
                style={styles.taskItem}
                onPress={() => router.push(`/task/${t.id}`)}
              >
                <View style={styles.taskItemContent}>
                  <Text style={styles.taskItemTitle} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <StatusBadge status={t.status} />
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </MotionPressable>
            ))
          )}
        </View>

        {/* Кнопка удаления */}
        <MotionPressable
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Удалить цель</Text>
        </MotionPressable>
      </ScrollView>

      {/* Модалка добавления прогресса (Aceternity dark luxury modal) */}
      <Modal
        visible={progressModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setProgressModalVisible(false)}
      >
        <SafeAreaView style={styles.safeAreaModal}>
          <View style={styles.modalContent}>
            <View style={styles.dragIndicator} />
            <Text style={styles.modalTitle}>Добавить прогресс</Text>
            <Text style={styles.modalSubtitle}>
              Введите значение, на которое увеличился результат:
            </Text>

            <View style={styles.deltaInputCard}>
              <TextInput
                style={styles.deltaInput}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={progressDelta}
                onChangeText={setProgressDelta}
                autoFocus
              />
              {unit ? <Text style={styles.deltaUnit}>{unit}</Text> : null}
            </View>

            {/* Быстрые кнопки */}
            <View style={styles.quickChipsRow}>
              {[100, 500, 1000, 5000].map((val) => (
                <MotionPressable
                  key={val}
                  style={styles.quickChip}
                  onPress={() => setProgressDelta(val.toString())}
                >
                  <Text style={styles.quickChipText}>+{val}</Text>
                </MotionPressable>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <MotionPressable
                onPress={handleAddProgress}
                style={styles.modalPrimaryBtnContainer}
              >
                <LinearGradient
                  colors={Theme.colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalBtnPrimary}
                >
                  <Text style={styles.modalBtnPrimaryText}>Добавить</Text>
                </LinearGradient>
              </MotionPressable>
              <MotionPressable
                style={styles.modalBtnCancel}
                onPress={() => setProgressModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Отмена</Text>
              </MotionPressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: '#334155',
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
  progressCard: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#232E48',
    ...Theme.shadows.card,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 0.8,
  },
  percentBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  percentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#818CF8',
  },
  progressBar: {
    marginBottom: 14,
  },
  progressValues: {
    marginBottom: 18,
  },
  currentValueText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#64748B',
  },
  addProgressBtnContainer: {
    borderRadius: Theme.radii.lg,
    overflow: 'hidden',
  },
  addProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Theme.radii.lg,
    gap: 8,
    ...Theme.shadows.glowPrimary,
  },
  addProgressBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
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
  emptyTasksBox: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#232E48',
  },
  emptyTasksText: {
    fontSize: 14,
    color: '#64748B',
  },
  taskItem: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#232E48',
  },
  taskItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  taskItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Theme.radii.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginTop: 10,
    marginBottom: 30,
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  safeAreaModal: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  modalContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#334155',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
    textAlign: 'center',
  },
  deltaInputCard: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.xl,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6366F1',
    ...Theme.shadows.glowPrimary,
  },
  deltaInput: {
    fontSize: 34,
    fontWeight: '800',
    color: '#818CF8',
    textAlign: 'center',
  },
  deltaUnit: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  quickChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818CF8',
  },
  modalBtnRow: {
    width: '100%',
    gap: 12,
  },
  modalPrimaryBtnContainer: {
    borderRadius: Theme.radii.lg,
    overflow: 'hidden',
    width: '100%',
  },
  modalBtnPrimary: {
    paddingVertical: 16,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    width: '100%',
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  modalBtnCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  modalBtnCancelText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
});
