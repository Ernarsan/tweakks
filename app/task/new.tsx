import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createTask, getGoals, Goal } from '../../lib/db';
import { Theme } from '../../lib/theme';
import { GoalPickerModal } from '../../components/GoalPickerModal';
import { MotionPressable } from '../../components/MotionPressable';

export default function NewTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGoals()
      .then(setGoals)
      .catch((err) => console.error('Ошибка загрузки целей:', err));
  }, []);

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Укажите заголовок', 'Заголовок задачи не может быть пустым.');
      return;
    }

    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || null,
        goal_id: selectedGoalId,
        status: 'not_started',
      });
      router.back();
    } catch (err) {
      console.error('Ошибка сохранения задачи:', err);
      Alert.alert('Ошибка', 'Не удалось сохранить задачу');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>НАЗВАНИЕ ЗАДАЧИ *</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, Записаться к стоматологу"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              autoFocus
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ОПИСАНИЕ</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Дополнительные детали, ссылки или заметки..."
              placeholderTextColor="#64748B"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ПРИВЯЗКА К ЦЕЛИ</Text>
          <MotionPressable
            style={styles.pickerButton}
            onPress={() => setGoalPickerVisible(true)}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name={selectedGoal ? 'flag' : 'flag-outline'}
                size={18}
                color={selectedGoal ? '#818CF8' : '#64748B'}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedGoal && styles.pickerPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedGoal ? selectedGoal.title : 'Без цели'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748B" />
          </MotionPressable>
        </View>

        <MotionPressable
          onPress={handleSave}
          disabled={saving}
          style={styles.submitContainer}
        >
          <LinearGradient
            colors={Theme.colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>
              {saving ? 'Сохранение...' : 'Создать задачу'}
            </Text>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </LinearGradient>
        </MotionPressable>
      </ScrollView>

      <GoalPickerModal
        visible={goalPickerVisible}
        goals={goals}
        selectedGoalId={selectedGoalId}
        onSelectGoal={setSelectedGoalId}
        onClose={() => setGoalPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputCard: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#232E48',
  },
  textInput: {
    fontSize: 16,
    color: '#F8FAFC',
  },
  textArea: {
    minHeight: 90,
  },
  pickerButton: {
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#232E48',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  pickerPlaceholder: {
    color: '#64748B',
    fontWeight: '400',
  },
  submitContainer: {
    marginTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Theme.shadows.glowPrimary,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
