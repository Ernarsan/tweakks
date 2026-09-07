import React, { useState } from 'react';
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
import { createGoal } from '../../lib/db';

export default function NewGoalScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Заголовок обязателен', 'Пожалуйста, введите название цели.');
      return;
    }

    const numericTarget = parseFloat(targetValue.replace(',', '.'));
    if (isNaN(numericTarget) || numericTarget <= 0) {
      Alert.alert(
        'Некорректная цель',
        'Укажите положительное числовое значение для целевого показателя.'
      );
      return;
    }

    setSaving(true);
    try {
      await createGoal({
        title: title.trim(),
        target_value: numericTarget,
        unit: unit.trim() || null,
        deadline: deadline.trim() || null,
      });
      router.back();
    } catch (err) {
      console.error('Ошибка создания цели:', err);
      Alert.alert('Ошибка', 'Не удалось сохранить цель');
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
          <Text style={styles.sectionTitle}>Название цели *</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, Заработать 50000"
              placeholderTextColor="#8E8E93"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Целевое значение *</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, 50000"
              placeholderTextColor="#8E8E93"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Единица измерения (необязательно)</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, ₽, км, книг, часов"
              placeholderTextColor="#8E8E93"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Срок / дедлайн (необязательно)</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, 31.12.2025 или к лету"
              placeholderTextColor="#8E8E93"
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>
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
            {saving ? 'Сохранение...' : 'Создать цель'}
          </Text>
        </Pressable>
      </ScrollView>
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
