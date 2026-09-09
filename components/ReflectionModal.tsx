import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../lib/theme';

interface ReflectionModalProps {
  visible: boolean;
  initialValue?: string | null;
  onSave: (reflection: string) => void;
  onSkip: () => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  visible,
  initialValue = '',
  onSave,
  onSkip,
}) => {
  const [reflection, setReflection] = useState(initialValue || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setReflection(initialValue || '');
    }
  }, [visible, initialValue]);

  const handleSave = () => {
    onSave(reflection.trim());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onSkip}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Верхняя шапка */}
          <View style={styles.header}>
            <View style={styles.dragIndicator} />

            <View style={styles.badgeTop}>
              <Ionicons name="sparkles" size={13} color={THEME.colors.primary} />
              <Text style={styles.badgeTopText}>РЕФЛЕКСИЯ</Text>
            </View>

            <Text style={styles.title}>Как это было?</Text>
            <Text style={styles.subtitle}>
              Зафиксируйте инсайты, выводы или сложности. Рефлексия помогает лучше понимать свой темп и праздновать победы.
            </Text>
          </View>

          {/* Поле ввода в стиле Aceternity Card */}
          <View
            style={[
              styles.inputCard,
              isFocused && styles.inputCardFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Что получилось особенно хорошо? Чему научились?.."
              placeholderTextColor={THEME.colors.textMuted}
              value={reflection}
              onChangeText={setReflection}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
            />
          </View>

          {/* Кнопки действий */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Сохранить вывод</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onSkip}
            >
              <Text style={styles.skipButtonText}>Пропустить рефлексию</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
  },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    marginBottom: 10,
  },
  badgeTopText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  inputCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginVertical: 14,
    ...THEME.shadows.card,
  },
  inputCardFocused: {
    borderColor: THEME.colors.primary,
    ...THEME.shadows.glowIndigo,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME.colors.textPrimary,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 10,
  },
  saveButton: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: THEME.radii.md,
    gap: 8,
    ...THEME.shadows.glowIndigo,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: THEME.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
