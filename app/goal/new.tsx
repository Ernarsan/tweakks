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
import { Ionicons } from '@expo/vector-icons';
import { createGoal } from '../../lib/db';
import { THEME } from '../../lib/theme';

export default function NewGoalScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Заголовок обязателен', 'Пожалуйста, укажите название цели.');
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
              placeholder="Например, Заработать 100 000"
              placeholderTextColor={THEME.colors.textMuted}
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
              placeholder="Например, 100000"
              placeholderTextColor={THEME.colors.textMuted}
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
              placeholder="Например, ₽, $, км, книг, часов"
              placeholderTextColor={THEME.colors.textMuted}
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
              placeholderTextColor={THEME.colors.textMuted}
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>
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
          <Ionicons name="flag" size={18} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {saving ? 'Сохранение...' : 'Поставить цель'}
          </Text>
        </Pressable>
      </ScrollView>
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
