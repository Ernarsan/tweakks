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
  Modal,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { THEME } from '../../lib/theme';

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

  const applyProgressDelta = async (delta: number) => {
    try {
      await addGoalProgress(goalId, delta);
      await loadData();
    } catch (err) {
      console.error('Ошибка добавления прогресса:', err);
      Alert.alert('Ошибка', 'Не удалось обновить прогресс');
    }
  };

  const handleCustomProgressSubmit = async () => {
    const delta = parseFloat(progressDelta.replace(',', '.'));
    if (isNaN(delta) || delta <= 0) {
      Alert.alert('Некорректная сумма', 'Введите положительное число.');
      return;
    }

    await applyProgressDelta(delta);
    setProgressModalVisible(false);
    setProgressDelta('');
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
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Цель не найдена</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Вернуться назад</Text>
        </Pressable>
      </View>
    );
  }

  const percent = Math.min(
    Math.round((goal.current_value / (goal.target_value || 1)) * 100),
    100
  );
  const isCompleted = goal.current_value >= goal.target_value && goal.target_value > 0;
  const unitStr = goal.unit ? ` ${goal.unit}` : '';
  const remaining = Math.max(0, goal.target_value - goal.current_value);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bento Hero Card Прогресса */}
        <View style={[styles.heroCard, isCompleted && styles.heroCardCompleted]}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroPreTitle}>ТЕКУЩИЙ ПРОГРЕСС</Text>
              <Text style={styles.heroValueMain}>
                {goal.current_value}
                <Text style={styles.heroTargetSub}> / {goal.target_value}{unitStr}</Text>
              </Text>
            </View>

            <View
              style={[
                styles.heroPercentPill,
                isCompleted && styles.heroPercentPillCompleted,
              ]}
            >
              <Text
                style={[
                  styles.heroPercentText,
                  isCompleted && styles.heroPercentTextCompleted,
                ]}
              >
                {percent}%
              </Text>
            </View>
          </View>

          <ProgressBar
            current={goal.current_value}
            target={goal.target_value}
            height={10}
            style={styles.progressBar}
          />

          <View style={styles.remainingRow}>
            <Text style={styles.remainingText}>
              {isCompleted ? '🎉 Цель успешно достигнута!' : `Осталось набрать: ${remaining}${unitStr}`}
            </Text>
          </View>

          {/* Быстрые чипы добавления прогресса в стиле Aceternity */}
          <Text style={styles.quickAddLabel}>Быстро добавить прогресс:</Text>
          <View style={styles.chipsRow}>
            {[100, 500, 1000, 5000].map((val) => (
              <Pressable
                key={val}
                style={({ pressed }) => [
                  styles.chipBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
                ]}
                onPress={() => applyProgressDelta(val)}
              >
                <Text style={styles.chipBtnText}>+{val}</Text>
              </Pressable>
            ))}
          </View>

          {/* Кнопка произвольного ввода */}
          <Pressable
            style={({ pressed }) => [
              styles.addProgressBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => setProgressModalVisible(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addProgressBtnText}>+ ввести другую сумму</Text>
          </Pressable>
        </View>

        {/* Редактируемые поля цели */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Название цели</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Название цели"
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Целевое значение</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="decimal-pad"
              placeholder="Целевое значение"
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Единица измерения</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={unit}
              onChangeText={setUnit}
              placeholder="₽, км, книг, задач и т.д."
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Срок / дедлайн</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="Например, 31.12.2025"
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>
        </View>

        {/* Список связанных задач */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Привязанные задачи ({tasks.length})
          </Text>
          {tasks.length === 0 ? (
            <View style={styles.emptyTasksBox}>
              <Text style={styles.emptyTasksText}>
                К этой цели пока не привязано ни одной задачи
              </Text>
            </View>
          ) : (
            tasks.map((t) => (
              <Pressable
                key={t.id}
                style={({ pressed }) => [
                  styles.taskItem,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push(`/task/${t.id}`)}
              >
                <View style={styles.taskItemContent}>
                  <Text style={styles.taskItemTitle} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <StatusBadge status={t.status} />
                </View>
                <Ionicons name="chevron-forward" size={16} color={THEME.colors.textMuted} />
              </Pressable>
            ))
          )}
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
          <Text style={styles.deleteButtonText}>Удалить цель</Text>
        </Pressable>
      </ScrollView>

      {/* Модалка произвольного ввода прогресса */}
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
              Введите значение, на которое увеличился текущий результат цели:
            </Text>

            <View style={styles.deltaInputCard}>
              <TextInput
                style={styles.deltaInput}
                placeholder="0"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="decimal-pad"
                value={progressDelta}
                onChangeText={setProgressDelta}
                autoFocus
              />
              {unit ? <Text style={styles.deltaUnit}>{unit}</Text> : null}
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleCustomProgressSubmit}
              >
                <Text style={styles.modalBtnPrimaryText}>Применить</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setProgressModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Отмена</Text>
              </Pressable>
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
  heroCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  heroCardCompleted: {
    borderColor: THEME.colors.successBorder,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroValueMain: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  heroTargetSub: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  heroPercentPill: {
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
  },
  heroPercentPillCompleted: {
    backgroundColor: THEME.colors.successLight,
  },
  heroPercentText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  heroPercentTextCompleted: {
    color: THEME.colors.success,
  },
  progressBar: {
    marginBottom: 12,
  },
  remainingRow: {
    marginBottom: 16,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  quickAddLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chipBtn: {
    flex: 1,
    backgroundColor: THEME.colors.primaryLight,
    paddingVertical: 10,
    borderRadius: THEME.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderActive,
  },
  chipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  addProgressBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    gap: 8,
    ...THEME.shadows.glowIndigo,
  },
  addProgressBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
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
  emptyTasksBox: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emptyTasksText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
  },
  taskItem: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
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
    color: THEME.colors.textPrimary,
    flex: 1,
    marginRight: 12,
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
  safeAreaModal: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  modalContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  deltaInputCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    ...THEME.shadows.glowIndigo,
  },
  deltaInput: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.primary,
    textAlign: 'center',
  },
  deltaUnit: {
    fontSize: 20,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalBtnRow: {
    width: '100%',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    width: '100%',
  },
  modalBtnPrimary: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.glowIndigo,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
  },
  modalBtnCancelText: {
    color: THEME.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
