import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../lib/db';

interface GoalPickerModalProps {
  visible: boolean;
  goals: Goal[];
  selectedGoalId: number | null;
  onSelectGoal: (goalId: number | null) => void;
  onClose: () => void;
}

export const GoalPickerModal: React.FC<GoalPickerModalProps> = ({
  visible,
  goals,
  selectedGoalId,
  onSelectGoal,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.dragIndicator} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Выберите цель</Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.closeText}>Готово</Text>
              </Pressable>
            </View>
          </View>

          <FlatList
            data={[{ id: -1, title: 'Без цели', target_value: 0, current_value: 0, unit: null, deadline: null, created_at: '' }, ...goals]}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isNone = item.id === -1;
              const isSelected = isNone ? selectedGoalId === null : selectedGoalId === item.id;

              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.goalItem,
                    pressed && styles.itemPressed,
                  ]}
                  onPress={() => {
                    onSelectGoal(isNone ? null : item.id);
                    onClose();
                  }}
                >
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalTitle, isNone && styles.noGoalTitle]}>
                      {item.title}
                    </Text>
                    {!isNone && (
                      <Text style={styles.goalMeta}>
                        Прогресс: {item.current_value} / {item.target_value}{item.unit ? ` ${item.unit}` : ''}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    alignItems: 'center',
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C7C7CC',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  goalItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemPressed: {
    backgroundColor: '#E5E5EA',
  },
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  noGoalTitle: {
    color: '#8E8E93',
    fontWeight: '500',
  },
  goalMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
});
