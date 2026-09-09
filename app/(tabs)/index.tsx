import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTasks, deleteTask, Task } from '../../lib/db';
import { StatusBadge } from '../../components/StatusBadge';
import { SwipeableRow } from '../../components/SwipeableRow';
import { SegmentedFilter, FilterType } from '../../components/SegmentedFilter';
import { THEME } from '../../lib/theme';

export default function TasksScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasksCount, setAllTasksCount] = useState({
    all: 0,
    not_started: 0,
    in_progress: 0,
    completed: 0,
  });
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async (filter: FilterType) => {
    try {
      const [filteredData, allData] = await Promise.all([
        getTasks(filter),
        getTasks('all'),
      ]);

      setTasks(filteredData);
      setAllTasksCount({
        all: allData.length,
        not_started: allData.filter((t) => t.status === 'not_started').length,
        in_progress: allData.filter((t) => t.status === 'in_progress').length,
        completed: allData.filter((t) => t.status === 'completed').length,
      });
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
          style={({ pressed }) => [
            styles.headerAddBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.headerAddBtnText}>Задача</Text>
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks(currentFilter);
    setRefreshing(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await loadTasks(currentFilter);
    } catch (err) {
      console.error('Ошибка удаления задачи:', err);
    }
  };

  const filtersList: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Все', count: allTasksCount.all },
    { key: 'not_started', label: 'Не начато', count: allTasksCount.not_started },
    { key: 'in_progress', label: 'В процессе', count: allTasksCount.in_progress },
    { key: 'completed', label: 'Выполнено', count: allTasksCount.completed },
  ];

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
            <StatusBadge status={item.status} />
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.cardFooter}>
            {item.goal_title ? (
              <View style={styles.goalTag}>
                <Ionicons name="flag" size={12} color={THEME.colors.primary} />
                <Text style={styles.goalTagText} numberOfLines={1}>
                  {item.goal_title}
                </Text>
              </View>
            ) : (
              <View />
            )}

            {item.reflection && (
              <View style={styles.reflectionIndicator}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={13}
                  color={THEME.colors.secondary}
                />
                <Text style={styles.reflectionIndicatorText}>Есть рефлексия</Text>
              </View>
            )}
          </View>
        </View>
      </SwipeableRow>
    );
  };

  return (
    <View style={styles.container}>
      {/* Bento-статистика вверху */}
      <View style={styles.statsBanner}>
        <View style={styles.statsCard}>
          <View style={styles.statsIconWrap}>
            <Ionicons name="flash" size={18} color={THEME.colors.primary} />
          </View>
          <View>
            <Text style={styles.statsValue}>{allTasksCount.in_progress}</Text>
            <Text style={styles.statsLabel}>В работе</Text>
          </View>
        </View>

        <View style={styles.statsDivider} />

        <View style={styles.statsCard}>
          <View style={[styles.statsIconWrap, { backgroundColor: THEME.colors.successLight }]}>
            <Ionicons name="checkmark-done" size={18} color={THEME.colors.success} />
          </View>
          <View>
            <Text style={[styles.statsValue, { color: THEME.colors.success }]}>
              {allTasksCount.completed}
            </Text>
            <Text style={styles.statsLabel}>Выполнено</Text>
          </View>
        </View>

        <View style={styles.statsDivider} />

        <View style={styles.statsCard}>
          <View style={[styles.statsIconWrap, { backgroundColor: THEME.colors.notStartedLight }]}>
            <Ionicons name="time-outline" size={18} color={THEME.colors.textMuted} />
          </View>
          <View>
            <Text style={styles.statsValue}>{allTasksCount.not_started}</Text>
            <Text style={styles.statsLabel}>Ожидают</Text>
          </View>
        </View>
      </View>

      {/* Фильтры */}
      <SegmentedFilter
        filters={filtersList}
        currentFilter={currentFilter}
        onSelect={(f) => {
          setCurrentFilter(f);
          loadTasks(f);
        }}
      />

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
            tintColor={THEME.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="sparkles-outline"
                size={36}
                color={THEME.colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {currentFilter === 'all'
                ? 'Нет задач'
                : 'В этой категории пусто'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {currentFilter === 'all'
                ? 'Поставьте себе первую задачу и начните двигаться к целям'
                : 'Попробуйте переключить фильтр или создайте новую задачу'}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyCreateBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => router.push('/task/new')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyCreateBtnText}>Создать задачу</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.full,
    marginRight: 8,
    ...THEME.shadows.glowIndigo,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.textMuted,
  },
  statsDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.border,
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
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
  },
  goalTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  reflectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reflectionIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...THEME.shadows.glowIndigo,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    ...THEME.shadows.glowIndigo,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
