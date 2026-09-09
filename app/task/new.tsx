import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createTask, getGoals, Goal } from '../../lib/db';
import { GoalPickerModal } from '../../components/GoalPickerModal';
import { THEME } from '../../lib/theme';

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
          <Text style={styles.sectionTitle}>Название задачи *</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, Подготовить отчет по спринту"
              placeholderTextColor={THEME.colors.textMuted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              autoFocus
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Дополнительные детали, ссылки или критерии готовности..."
              placeholderTextColor={THEME.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Привязка к цели</Text>
          <Pressable
            style={({ pressed }) => [
              styles.pickerButton,
              pressed && styles.pickerButtonPressed,
            ]}
            onPress={() => setGoalPickerVisible(true)}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name={selectedGoal ? 'flag' : 'flag-outline'}
                size={18}
                color={selectedGoal ? THEME.colors.primary : THEME.colors.textMuted}
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
            <Ionicons name="chevron-forward" size={16} color={THEME.colors.textMuted} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            saving && styles.submitButtonDisabled,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {saving ? 'Сохранение...' : 'Создать задачу'}
          </Text>
        </Pressable>
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
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  textInput: {
    fontSize: 16,
    color: THEME.colors.textPrimary,
  },
  textArea: {
    minHeight: 90,
  },
  pickerButton: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  pickerButtonPressed: {
    backgroundColor: THEME.colors.backgroundSubtle,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: THEME.colors.textMuted,
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: THEME.radii.md,
    gap: 8,
    marginTop: 12,
    ...THEME.shadows.glowIndigo,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
