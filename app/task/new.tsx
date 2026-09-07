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
              placeholder="Например, Записаться к стоматологу"
              placeholderTextColor="#8E8E93"
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
              placeholder="Дополнительные детали, ссылки или заметки..."
              placeholderTextColor="#8E8E93"
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
                size={20}
                color={selectedGoal ? '#007AFF' : '#8E8E93'}
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
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            saving && styles.submitButtonDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
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
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    minHeight: 90,
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonPressed: {
    backgroundColor: '#F7F7F8',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: '#8E8E93',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
