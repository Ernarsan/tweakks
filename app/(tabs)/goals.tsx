import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getGoals, addGoalProgress, Goal } from '../../lib/db';
import { Theme } from '../../lib/theme';
import { ProgressBar } from '../../components/ProgressBar';
import { MotionPressable } from '../../components/MotionPressable';

export default function GoalsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Модалка добавления прогресса
  const [activeGoalForProgress, setActiveGoalForProgress] = useState<Goal | null>(null);
  const [progressDelta, setProgressDelta] = useState('');

  const loadGoals = useCallback(async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      console.error('Ошибка загрузки целей:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <MotionPressable
          onPress={() => router.push('/goal/new')}
          style={styles.headerAddBtn}
        >
          <Ionicons name="add" size={24} color="#818CF8" />
        </MotionPressable>
      ),
    });
  }, [navigation, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const handleAddProgress = async () => {
    if (!activeGoalForProgress) return;
    const delta = parseFloat(progressDelta.replace(',', '.'));
    if (isNaN(delta) || delta <= 0) {
      Alert.alert('Некорректная сумма', 'Введите положительное число для добавления прогресса.');
      return;
    }

    try {
      await addGoalProgress(activeGoalForProgress.id, delta);
      setActiveGoalForProgress(null);
      setProgressDelta('');
      await loadGoals();
    } catch (err) {
      console.error('Ошибка добавления прогресса:', err);
      Alert.alert('Ошибка', 'Не удалось обновить прогресс');
    }
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const unitStr = item.unit ? ` ${item.unit}` : '';
    const percent = Math.min(
      Math.round((item.current_value / (item.target_value || 1)) * 100),
      100
    );
    const isCompleted = item.current_value >= item.target_value && item.target_value > 0;

    return (
      <View style={styles.card}>
        <MotionPressable onPress={() => router.push(`/goal/${item.id}`)}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.deadline ? (
                <View style={styles.deadlineContainer}>
                  <Ionicons name="calendar-outline" size={12} color="#64748B" />
                  <Text style={styles.deadlineText}>{item.deadline}</Text>
                </View>
              ) : null}
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

          <View style={styles.progressSection}>
            <ProgressBar
              current={item.current_value}
              target={item.target_value}
              height={8}
            />
          </View>
        </MotionPressable>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.valuesLabel}>ПРОГРЕСС</Text>
            <Text style={styles.valuesText}>
              {item.current_value}
              <Text style={styles.valuesTotal}> / {item.target_value}{unitStr}</Text>
            </Text>
          </View>

          {/* Кнопка быстрого добавления прогресса */}
          <MotionPressable
            onPress={() => {
              setActiveGoalForProgress(item);
              setProgressDelta('');
            }}
          >
            <LinearGradient
              colors={
                isCompleted
                  ? Theme.colors.gradients.success
                  : Theme.colors.gradients.primary
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quickProgressBtn}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.quickProgressBtnText}>Прогресс</Text>
            </LinearGradient>
          </MotionPressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Кнопка создания цели сверху */}
      <View style={styles.topBar}>
        <MotionPressable onPress={() => router.push('/goal/new')}>
          <LinearGradient
            colors={['#162038', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createGoalTopBtn}
          >
            <View style={styles.createGoalIconCircle}>
              <Ionicons name="add" size={18} color="#818CF8" />
            </View>
            <Text style={styles.createGoalTopBtnText}>Поставить новую цель</Text>
          </LinearGradient>
        </MotionPressable>
      </View>

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
            tintColor="#818CF8"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="flag-outline" size={32} color="#64748B" />
            </View>
            <Text style={styles.emptyTitle}>Нет целей</Text>
            <Text style={styles.emptySubtitle}>
              Нажмите кнопку сверху, чтобы сформулировать свою первую цель
            </Text>
          </View>
        }
      />

      {/* Модалка добавления прогресса */}
      <Modal
        visible={!!activeGoalForProgress}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setActiveGoalForProgress(null)}
      >
        <SafeAreaView style={styles.safeAreaModal}>
          <View style={styles.modalContent}>
            <View style={styles.dragIndicator} />
            <Text style={styles.modalTitle}>Добавить прогресс</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              Цель: «{activeGoalForProgress?.title}»
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
              {activeGoalForProgress?.unit ? (
                <Text style={styles.deltaUnit}>
                  {activeGoalForProgress.unit}
                </Text>
              ) : null}
            </View>

            {/* Быстрые чипы */}
            <View style={styles.quickChipsRow}>
              {[100, 500, 1000, 5000].map((val) => (
                <MotionPressable
                  key={val}
                  onPress={() => setProgressDelta(val.toString())}
                >
                  <View style={styles.quickChip}>
                    <Text style={styles.quickChipText}>+{val}</Text>
                  </View>
                </MotionPressable>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <MotionPressable onPress={handleAddProgress}>
                <LinearGradient
                  colors={Theme.colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalBtnPrimary}
                >
                  <Text style={styles.modalBtnPrimaryText}>Добавить к результату</Text>
                </LinearGradient>
              </MotionPressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalBtnCancel,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => setActiveGoalForProgress(null)}
              >
                <Text style={styles.modalBtnCancelText}>Отмена</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  createGoalTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: '#232E48',
    gap: 10,
  },
  createGoalIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createGoalTopBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#232E48',
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 22,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  deadlineText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  percentBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  percentBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#818CF8',
  },
  percentTextCompleted: {
    color: '#34D399',
  },
  progressSection: {
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1A233A',
    paddingTop: 12,
  },
  valuesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  valuesText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  valuesTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  quickProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radii.full,
    gap: 5,
  },
  quickProgressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
  safeAreaModal: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#334155',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  deltaInputCard: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: '#232E48',
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  deltaInput: {
    fontSize: 34,
    fontWeight: '700',
    color: '#818CF8',
    textAlign: 'center',
  },
  deltaUnit: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickChip: {
    backgroundColor: '#162038',
    borderWidth: 1,
    borderColor: '#232E48',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radii.full,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818CF8',
  },
  modalBtnRow: {
    width: '100%',
    gap: 10,
  },
  modalBtnPrimary: {
    paddingVertical: 16,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    width: '100%',
    ...Theme.shadows.glowPrimary,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBtnCancel: {
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  modalBtnCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
});
