import React, { useState } from 'react';
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
import { createGoal } from '../../lib/db';
import { Theme } from '../../lib/theme';
import { MotionPressable } from '../../components/MotionPressable';

const UNIT_PRESETS = ['₽', '$', 'км', 'книг', 'часов', '%'];

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
          <Text style={styles.sectionTitle}>НАЗВАНИЕ ЦЕЛИ *</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, Накопить 100 000"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ЦЕЛЕВОЕ ЗНАЧЕНИЕ *</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, 100000"
              placeholderTextColor="#64748B"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ЕДИНИЦА ИЗМЕРЕНИЯ (НЕОБЯЗАТЕЛЬНО)</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, ₽, км, книг, часов"
              placeholderTextColor="#64748B"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
          {/* Быстрые пресеты */}
          <View style={styles.unitPresets}>
            {UNIT_PRESETS.map((p) => (
              <MotionPressable
                key={p}
                onPress={() => setUnit(p)}
                style={[
                  styles.unitChip,
                  unit === p && styles.unitChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.unitChipText,
                    unit === p && styles.unitChipTextActive,
                  ]}
                >
                  {p}
                </Text>
              </MotionPressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>СРОК / ДЕДЛАЙН (НЕОБЯЗАТЕЛЬНО)</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Например, 31.12.2025 или к лету"
              placeholderTextColor="#64748B"
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>
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
              {saving ? 'Сохранение...' : 'Создать цель'}
            </Text>
            <Ionicons name="flag" size={18} color="#FFFFFF" />
          </LinearGradient>
        </MotionPressable>
      </ScrollView>
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
  unitPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginLeft: 4,
  },
  unitChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitChipActive: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  unitChipText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  unitChipTextActive: {
    color: '#A5B4FC',
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
