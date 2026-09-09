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
import { THEME } from '../lib/theme';

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
              <Text style={styles.title}>Привязка к цели</Text>
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
                <Pressable
                  style={({ pressed }) => [
                    styles.goalItem,
                    isSelected && styles.goalItemSelected,
                    pressed && styles.itemPressed,
                  ]}
                  onPress={() => {
                    onSelectGoal(isNone ? null : item.id);
                    onClose();
                  }}
                >
                  <View style={styles.goalInfo}>
                    <View style={styles.titleRow}>
                      <Ionicons
                        name={isNone ? 'ellipse-outline' : 'flag'}
                        size={16}
                        color={isSelected ? THEME.colors.primary : THEME.colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.goalTitle,
                          isNone && styles.noGoalTitle,
                          isSelected && styles.goalTitleSelected,
                        ]}
                      >
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
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={THEME.colors.primary}
                    />
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
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
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
    color: THEME.colors.textPrimary,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  goalItem: {
    backgroundColor: THEME.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  goalItemSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
  },
  itemPressed: {
    opacity: 0.8,
  },
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  goalTitleSelected: {
    color: THEME.colors.primary,
  },
  noGoalTitle: {
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  goalMeta: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
    marginLeft: 24,
  },
});
