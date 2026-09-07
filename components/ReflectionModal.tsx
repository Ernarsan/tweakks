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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../lib/theme';
import { MotionPressable } from './MotionPressable';

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
          <View style={styles.header}>
            <View style={styles.dragIndicator} />
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={24} color="#818CF8" />
            </View>
            <Text style={styles.title}>Как это было?</Text>
            <Text style={styles.subtitle}>
              Зафиксируйте инсайты, выводы или сложности. Рефлексия помогает закреплять опыт.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                isFocused && styles.inputFocused,
              ]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Что получилось? Какой опыт извлекли?.."
              placeholderTextColor="#64748B"
              value={reflection}
              onChangeText={setReflection}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
            />
          </View>

          <View style={styles.buttonContainer}>
            <MotionPressable onPress={handleSave}>
              <LinearGradient
                colors={Theme.colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Сохранить вывод</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </MotionPressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && { opacity: 0.6 },
              ]}
              onPress={onSkip}
            >
              <Text style={styles.skipButtonText}>Пропустить без записи</Text>
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
    backgroundColor: '#0B0F19',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dragIndicator: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#334155',
    marginBottom: 18,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flex: 1,
    marginVertical: 14,
  },
  input: {
    flex: 1,
    backgroundColor: '#131B2E',
    borderRadius: Theme.radii.lg,
    padding: 18,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#232E48',
    minHeight: 140,
    lineHeight: 24,
  },
  inputFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#162038',
  },
  buttonContainer: {
    gap: 10,
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Theme.shadows.glowPrimary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
});
