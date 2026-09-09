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
import { getGoals, getTasks, Goal, Task } from '../../lib/db';
import { ProgressBar } from '../../components/ProgressBar';
import { THEME } from '../../lib/theme';

export default function GoalsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [goalsData, tasksData] = await Promise.all([
        getGoals(),
        getTasks('all'),
      ]);
      setGoals(goalsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Ошибка загрузки целей:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/goal/new')}
          style={({ pressed }) => [
            styles.headerAddBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.headerAddBtnText}>Цель</Text>
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const unitStr = item.unit ? ` ${item.unit}` : '';
    const percent = Math.min(
      Math.round((item.current_value / (item.target_value || 1)) * 100),
      100
    );
    const isCompleted = item.current_value >= item.target_value && item.target_value > 0;

    const linkedTasks = tasks.filter((t) => t.goal_id === item.id);
    const completedTasksCount = linkedTasks.filter((t) => t.status === 'completed').length;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isCompleted && styles.cardCompleted,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/goal/${item.id}`)}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.titleArea}>
            <View
              style={[
                styles.goalIconWrap,
                isCompleted && { backgroundColor: THEME.colors.successLight },
              ]}
            >
              <Ionicons
                name={isCompleted ? 'trophy' : 'flag'}
                size={18}
                color={isCompleted ? THEME.colors.success : THEME.colors.primary}
              />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <View
            style={[
              styles.percentBadge,
              isCompleted && styles.percentBadgeCompleted,
            ]}
          >
            <Text
              style={[
                styles.percentText,
                isCompleted && styles.percentTextCompleted,
              ]}
            >
              {percent}%
            </Text>
          </View>
        </View>

        {/* Прогресс-бар с анимацией */}
        <View style={styles.progressSection}>
          <ProgressBar
            current={item.current_value}
            target={item.target_value}
            height={9}
          />
        </View>

        {/* Числовой прогресс */}
        <View style={styles.valuesRow}>
          <Text style={styles.valuesText}>
            <Text style={styles.currentValueBold}>{item.current_value}</Text>
            <Text style={styles.targetValueText}> / {item.target_value}{unitStr}</Text>
          </Text>

          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={THEME.colors.success} />
              <Text style={styles.completedBadgeText}>Достигнуто</Text>
            </View>
          )}
        </View>

        {/* Подвал карточки с метаданными */}
        <View style={styles.cardFooter}>
          <View style={styles.metaChip}>
            <Ionicons name="checkbox-outline" size={13} color={THEME.colors.textSecondary} />
            <Text style={styles.metaChipText}>
              Задачи: {completedTasksCount}/{linkedTasks.length}
            </Text>
          </View>

          {item.deadline ? (
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={13} color={THEME.colors.textSecondary} />
              <Text style={styles.metaChipText}>{item.deadline}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGoalCard}
        contentContainerStyle={[
          styles.listContent,
          goals.length === 0 && styles.emptyListContent,
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
              <Ionicons name="flag-outline" size={36} color={THEME.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Нет активных целей</Text>
            <Text style={styles.emptySubtitle}>
              Большие достижения начинаются с оцифрованной цели. Задайте целевой показатель и дедлайн.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyCreateBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => router.push('/goal/new')}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyCreateBtnText}>Поставить цель</Text>
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
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  cardCompleted: {
    borderColor: THEME.colors.successBorder,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 22,
  },
  percentBadge: {
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
  },
  percentBadgeCompleted: {
    backgroundColor: THEME.colors.successLight,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  percentTextCompleted: {
    color: THEME.colors.success,
  },
  progressSection: {
    marginVertical: 14,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  valuesText: {
    fontSize: 15,
  },
  currentValueBold: {
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    fontSize: 17,
  },
  targetValueText: {
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.backgroundSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
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
