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
import { Ionicons } from '@expo/vector-icons';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  Task,
  TaskStatus,
} from '../../lib/db';
import { StatusBadge } from '../../components/StatusBadge';
import { SwipeableRow } from '../../components/SwipeableRow';
import { ReflectionModal } from '../../components/ReflectionModal';

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

  // Быстрое добавление задачи сверху
  const [quickTitle, setQuickTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Рефлексия при быстром завершении задачи прямо из списка
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
        <Pressable
          onPress={() => router.push('/task/new')}
          style={({ pressed }) => [styles.headerAddBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="add" size={26} color="#007AFF" />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks(currentFilter);
    setRefreshing(false);
  };

  // Быстрое создание задачи по кнопке сверху
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

  // Быстрый старт задачи прямо из списка без захода внутрь
  const handleQuickStart = async (taskId: number) => {
    try {
      await updateTaskStatus(taskId, 'in_progress');
      await loadTasks(currentFilter);
    } catch (err) {
      console.error('Ошибка старта задачи:', err);
    }
  };

  // Быстрое завершение: открывает ReflectionModal прямо из списка
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

  const renderItem = ({ item }: { item: Task }) => {
    return (
      <SwipeableRow
        onDelete={() => handleDelete(item.id)}
        onPress={() => router.push(`/task/${item.id}`)}
        confirmTitle="Удалить задачу?"
        confirmMessage={`Вы уверены, что хотите удалить «${item.title}»?`}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Кнопка действия прямо на карточке сверху */}
            {item.status === 'not_started' && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtnStart,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleQuickStart(item.id)}
              >
                <Ionicons name="play" size={13} color="#007AFF" />
                <Text style={styles.actionBtnStartText}>Начать</Text>
              </Pressable>
            )}

            {item.status === 'in_progress' && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtnComplete,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => handleQuickCompletePress(item)}
              >
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnCompleteText}>Завершить</Text>
              </Pressable>
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
              <Ionicons name="flag-outline" size={13} color="#5856D6" />
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
      {/* Панель быстрого добавления задачи прямо сверху */}
      <View style={styles.quickAddContainer}>
        <TextInput
          style={styles.quickInput}
          placeholder="Новая задача..."
          placeholderTextColor="#8E8E93"
          value={quickTitle}
          onChangeText={setQuickTitle}
          onSubmitEditing={handleQuickAdd}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [
            styles.quickAddButton,
            !quickTitle.trim() && styles.quickAddButtonDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleQuickAdd}
          disabled={!quickTitle.trim() || creating}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Фильтры сверху */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((f) => {
          const isActive = currentFilter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => {
                setCurrentFilter(f.key);
                loadTasks(f.key);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkbox-outline" size={56} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>Нет задач</Text>
            <Text style={styles.emptySubtitle}>
              {currentFilter === 'all'
                ? 'Введите задачу в поле сверху и нажмите «+», чтобы создать ее мгновенно'
                : 'В этой категории пока нет задач'}
            </Text>
          </View>
        }
      />

      {/* Модалка рефлексии при завершении задачи прямо из списка */}
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
    backgroundColor: '#F2F2F7',
  },
  headerAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 10,
  },
  quickInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#000000',
  },
  quickAddButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddButtonDisabled: {
    backgroundColor: '#B0D5FF',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3C3C43',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 22,
  },
  actionBtnStart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1EFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  actionBtnStartText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionBtnComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  actionBtnCompleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 14,
    color: '#636366',
    marginTop: 6,
    lineHeight: 18,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#F0EFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5856D6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
