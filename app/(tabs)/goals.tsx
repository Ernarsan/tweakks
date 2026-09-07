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
import { Ionicons } from '@expo/vector-icons';
import { getGoals, addGoalProgress, Goal } from '../../lib/db';
import { ProgressBar } from '../../components/ProgressBar';

export default function GoalsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Модалка добавления прогресса прямо из списка
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
        <Pressable
          onPress={() => router.push('/goal/new')}
          style={({ pressed }) => [styles.headerAddBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="add" size={26} color="#007AFF" />
        </Pressable>
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

    return (
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [
            styles.cardTopArea,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.push(`/goal/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.percentText}>{percent}%</Text>
          </View>

          <View style={styles.progressSection}>
            <ProgressBar
              current={item.current_value}
              target={item.target_value}
              height={9}
            />
          </View>
        </Pressable>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.valuesText}>
              {item.current_value} / {item.target_value}{unitStr}
            </Text>
            {item.deadline ? (
              <View style={styles.deadlineContainer}>
                <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                <Text style={styles.deadlineText}>{item.deadline}</Text>
              </View>
            ) : null}
          </View>

          {/* Кнопка быстрого добавления прогресса прямо на карточке */}
          <Pressable
            style={({ pressed }) => [
              styles.quickProgressBtn,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {
              setActiveGoalForProgress(item);
              setProgressDelta('');
            }}
          >
            <Ionicons name="add" size={16} color="#007AFF" />
            <Text style={styles.quickProgressBtnText}>Прогресс</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Кнопка создания цели сверху */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [
            styles.createGoalTopBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.push('/goal/new')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.createGoalTopBtnText}>Поставить новую цель</Text>
        </Pressable>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={56} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>Нет целей</Text>
            <Text style={styles.emptySubtitle}>
              Нажмите кнопку выше, чтобы поставить свою первую цель
            </Text>
          </View>
        }
      />

      {/* Модалка добавления прогресса прямо из списка */}
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
                placeholderTextColor="#8E8E93"
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
    backgroundColor: '#F2F2F7',
  },
  headerAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  createGoalTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1EFFF',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  createGoalTopBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTopArea: {
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 22,
  },
  percentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  progressSection: {
    marginTop: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F2F2F7',
    paddingTop: 10,
  },
  valuesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3C3C43',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  deadlineText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  quickProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1EFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  quickProgressBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
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
