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
        <ActivityIndicator size="large" color="#007AFF" />
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
        {/* Карточка текущего прогресса */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressCardTitle}>Текущий прогресс</Text>
            <Text style={styles.percentBadge}>{percent}%</Text>
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
          <Pressable
            style={({ pressed }) => [
              styles.addProgressBtn,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setProgressModalVisible(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addProgressBtnText}>+ добавить прогресс</Text>
          </Pressable>
        </View>

        {/* Редактируемые поля */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Название цели</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Название цели"
              placeholderTextColor="#8E8E93"
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
              placeholderTextColor="#8E8E93"
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
              placeholder="₽, км, книг и т.д."
              placeholderTextColor="#8E8E93"
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
              placeholderTextColor="#8E8E93"
            />
          </View>
        </View>

        {/* Список связанных задач */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Связанные задачи ({tasks.length})
          </Text>
          {tasks.length === 0 ? (
            <View style={styles.emptyTasksBox}>
              <Text style={styles.emptyTasksText}>К этой цели пока не привязано задач</Text>
            </View>
          ) : (
            tasks.map((t) => (
              <Pressable
                key={t.id}
                style={({ pressed }) => [
                  styles.taskItem,
                  pressed && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => router.push(`/task/${t.id}`)}
              >
                <View style={styles.taskItemContent}>
                  <Text style={styles.taskItemTitle} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <StatusBadge status={t.status} />
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
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
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Удалить цель</Text>
        </Pressable>
      </ScrollView>

      {/* Модалка добавления прогресса */}
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
                placeholderTextColor="#8E8E93"
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
                <Pressable
                  key={val}
                  style={styles.quickChip}
                  onPress={() => setProgressDelta(val.toString())}
                >
                  <Text style={styles.quickChipText}>+{val}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleAddProgress}
              >
                <Text style={styles.modalBtnPrimaryText}>Добавить</Text>
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
    backgroundColor: '#F2F2F7',
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
    backgroundColor: '#F2F2F7',
  },
  notFoundText: {
    fontSize: 17,
    color: '#3C3C43',
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
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
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
  },
  percentBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  progressBar: {
    marginBottom: 12,
  },
  progressValues: {
    marginBottom: 16,
  },
  currentValueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  subText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#8E8E93',
  },
  addProgressBtn: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  addProgressBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
  },
  emptyTasksBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  taskItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    marginRight: 10,
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
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  safeAreaModal: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C7C7CC',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#636366',
    marginBottom: 20,
    textAlign: 'center',
  },
  deltaInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deltaInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
  },
  deltaUnit: {
    fontSize: 20,
    color: '#8E8E93',
    fontWeight: '600',
    marginLeft: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickChip: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalBtnRow: {
    width: '100%',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  modalBtnPrimary: {
    backgroundColor: '#007AFF',
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
  },
  modalBtnCancelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
});
