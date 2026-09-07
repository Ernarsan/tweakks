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
import { Theme } from '../lib/theme';
import { MotionPressable } from './MotionPressable';

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
            data={[
              {
                id: -1,
                title: 'Без цели',
                target_value: 0,
                current_value: 0,
                unit: null,
                deadline: null,
                created_at: '',
              },
              ...goals,
            ]}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isNone = item.id === -1;
              const isSelected = isNone ? selectedGoalId === null : selectedGoalId === item.id;

              return (
                <MotionPressable
                  style={[
                    styles.goalItem,
                    isSelected && styles.goalItemSelected,
                  ]}
                  onPress={() => {
                    onSelectGoal(isNone ? null : item.id);
                    onClose();
                  }}
                >
                  <View style={styles.goalInfo}>
                    <View style={styles.titleRow}>
                      <Ionicons
                        name={isNone ? 'file-tray-outline' : 'flag'}
                        size={18}
                        color={isSelected ? '#818CF8' : '#64748B'}
                      />
                      <Text style={[styles.goalTitle, isSelected && styles.goalTitleSelected]}>
                        {item.title}
                      </Text>
                    </View>
                    {!isNone && (
                      <Text style={styles.goalMeta}>
                        Прогресс: {item.current_value} / {item.target_value}
                        {item.unit ? ` ${item.unit}` : ''}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </MotionPressable>
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
    backgroundColor: '#0B0F19',
  },
  container: {
    flex: 1,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    alignItems: 'center',
  },
  dragIndicator: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#334155',
    marginBottom: 16,
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
    color: '#F8FAFC',
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#818CF8',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  goalItem: {
    backgroundColor: '#131B2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: '#232E48',
  },
  goalItemSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  goalTitleSelected: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  goalMeta: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    marginLeft: 28,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
