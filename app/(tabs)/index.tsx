import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  Task,
  TaskStatus,
} from '../../lib/db';
import { Theme } from '../../lib/theme';
import { StatusBadge } from '../../components/StatusBadge';
import { SwipeableRow } from '../../components/SwipeableRow';
import { ReflectionModal } from '../../components/ReflectionModal';
import { MotionPressable } from '../../components/MotionPressable';
import { ProgressBar } from '../../components/ProgressBar';

type FilterType = 'all' | TaskStatus;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'not_started', label: 'Не начато' },
  { key: 'in_progress', label: 'В процессе' },
  { key: 'completed', label: 'Выполнено' },
];

export default function TasksScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Быстрое добавление задачи
  const [quickTitle, setQuickTitle] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [creating, setCreating] = useState(false);

  // Рефлексия при быстром завершении
  const [completingTask, setCompletingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async (filter: FilterType) => {
    try {
      const data = await getTasks(filter);
      setTasks(data);
    } catch (err) {
      console.error('Ошибка загрузки задач:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks(currentFilter);
    }, [currentFilter, loadTasks])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MotionPressable
          onPress={() => router.push('/task/new')}
          style={styles.headerAddBtn}
        >
          <Ionicons name="add" size={24} color="#818CF8" />
        </MotionPressable>
      ),
    });
  }, [navigation, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks(currentFilter);
    setRefreshing(false);
  };

  const handleQuickAdd = async () => {
    if (!quickTitle.trim() || creating) return;

    setCreating(true);
    try {
      await createTask({
        title: quickTitle.trim(),
        status: 'not_started',
      });
      setQuickTitle('');
      Keyboard.dismiss();
      await loadTasks(currentFilter);
    } catch (err) {
      console.error('Ошибка создания задачи:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleQuickStart = async (taskId: number) => {
    try {
      await updateTaskStatus(taskId, 'in_progress');
      await loadTasks(currentFilter);
    } catch (err) {
      console.error('Ошибка старта задачи:', err);
    }
  };

  const handleQuickCompletePress = (task: Task) => {
    setCompletingTask(task);
  };

  const handleSaveReflection = async (reflectionText: string) => {
    if (!completingTask) return;
    try {
      await updateTaskStatus(completingTask.id, 'completed', reflectionText || null);
      setCompletingTask(null);
      await loadTasks(currentFilter);
    } catch (err) {
      console.error('Ошибка завершения задачи:', err);
    }
  };

  const handleSkipReflection = async () => {
    if (!completingTask) return;
    try {
      await updateTaskStatus(completingTask.id, 'completed', null);
      setCompletingTask(null);
      await loadTasks(currentFilter);
    } catch (err) {
      console.error('Ошибка пропуска рефлексии:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Ошибка удаления задачи:', err);
    }
  };

  // Статистика для Bento-виджета
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const totalCount = tasks.length;

  const renderItem = ({ item }: { item: Task }) => {
    return (
      <SwipeableRow
        onDelete={() => handleDelete(item.id)}
        onPress={() => router.push(`/task/${item.id}`)}
        confirmTitle="Удалить задачу?"
        confirmMessage={`Вы уверены, что хотите удалить «${item.title}»?`}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Кнопка действия сверху на карточке */}
            {item.status === 'not_started' && (
              <MotionPressable onPress={() => handleQuickStart(item.id)}>
                <LinearGradient
                  colors={['rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnStart}
                >
                  <Ionicons name="play" size={12} color="#818CF8" />
                  <Text style={styles.actionBtnStartText}>Начать</Text>
                </LinearGradient>
              </MotionPressable>
            )}

            {item.status === 'in_progress' && (
              <MotionPressable onPress={() => handleQuickCompletePress(item)}>
                <LinearGradient
                  colors={Theme.colors.gradients.success}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnComplete}
                >
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  <Text style={styles.actionBtnCompleteText}>Завершить</Text>
                </LinearGradient>
              </MotionPressable>
            )}

            {item.status === 'completed' && (
              <StatusBadge status="completed" />
            )}
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {item.goal_title ? (
            <View style={styles.goalTag}>
              <Ionicons name="flag" size={12} color="#818CF8" />
              <Text style={styles.goalTagText} numberOfLines={1}>
                {item.goal_title}
              </Text>
            </View>
          ) : null}
        </View>
      </SwipeableRow>
    );
  };

  return (
    <View style={styles.container}>
      {/* Bento Stats Banner (в стиле 21st.dev) */}
      <View style={styles.statsBanner}>
        <LinearGradient
          colors={['#162038', '#111827']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <View style={styles.statsTopRow}>
            <View>
              <Text style={styles.statsLabel}>ПРОДУКТИВНОСТЬ</Text>
              <Text style={styles.statsValue}>
                {completedCount} <Text style={styles.statsTotal}>из {totalCount} выполнено</Text>
              </Text>
            </View>
            <View style={styles.inProgressBadge}>
              <View style={styles.inProgressDot} />
              <Text style={styles.inProgressText}>{inProgressCount} в работе</Text>
            </View>
          </View>

          <ProgressBar
            current={completedCount}
            target={totalCount}
            height={6}
            style={styles.statsProgress}
          />
        </LinearGradient>
      </View>

      {/* Быстрое добавление задачи прямо сверху */}
      <View style={styles.quickAddWrapper}>
        <View style={[styles.quickAddContainer, inputFocused && styles.quickAddContainerFocused]}>
          <TextInput
            style={styles.quickInput}
            placeholder="Что нужно сделать?.."
            placeholderTextColor="#64748B"
            value={quickTitle}
            onChangeText={setQuickTitle}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onSubmitEditing={handleQuickAdd}
            returnKeyType="done"
          />
          <MotionPressable
            onPress={handleQuickAdd}
            disabled={!quickTitle.trim() || creating}
          >
            <LinearGradient
              colors={
                quickTitle.trim()
                  ? Theme.colors.gradients.primary
                  : (['#1E293B', '#1E293B'] as [string, string])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quickAddButton}
            >
              <Ionicons
                name="add"
                size={22}
                color={quickTitle.trim() ? '#FFFFFF' : '#64748B'}
              />
            </LinearGradient>
          </MotionPressable>
        </View>
      </View>

      {/* Фильтры в стиле Aceternity UI */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((f) => {
          const isActive = currentFilter === f.key;
          return (
            <MotionPressable
              key={f.key}
              onPress={() => {
                setCurrentFilter(f.key);
                loadTasks(f.key);
              }}
            >
              {isActive ? (
                <LinearGradient
                  colors={Theme.colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterChipActive}
                >
                  <Text style={styles.filterChipTextActive}>{f.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{f.label}</Text>
                </View>
              )}
            </MotionPressable>
          );
        })}
      </View>

      {/* Список задач */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          tasks.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#818CF8"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="sparkles-outline" size={32} color="#64748B" />
            </View>
            <Text style={styles.emptyTitle}>Нет задач</Text>
            <Text style={styles.emptySubtitle}>
              {currentFilter === 'all'
                ? 'Введите название задачи в строке выше и нажмите «+»'
                : 'В этой категории пока пусто'}
            </Text>
          </View>
        }
      />

      {/* Модалка рефлексии */}
      <ReflectionModal
        visible={!!completingTask}
        initialValue={completingTask?.reflection}
        onSave={handleSaveReflection}
        onSkip={handleSkipReflection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  headerAddBtn: {
    padding: 8,
    marginRight: 4,
  },
  statsBanner: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  statsGradient: {
    borderRadius: Theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#232E48',
  },
  statsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 0.8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  statsTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818CF8',
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A5B4FC',
  },
  statsProgress: {
    marginTop: 2,
  },
  quickAddWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#232E48',
    gap: 8,
  },
  quickAddContainerFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#162038',
  },
  quickInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#F8FAFC',
  },
  quickAddButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radii.full,
    backgroundColor: '#131B2E',
    borderWidth: 1,
    borderColor: '#232E48',
  },
  filterChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radii.full,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterChipTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardInner: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 22,
  },
  actionBtnStart: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    gap: 5,
  },
  actionBtnStartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A5B4FC',
  },
  actionBtnComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radii.full,
    gap: 5,
    ...Theme.shadows.glowSuccess,
  },
  actionBtnCompleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 20,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A5B4FC',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#131B2E',
    borderWidth: 1,
    borderColor: '#232E48',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
