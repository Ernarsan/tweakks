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
            <Text style={styles.title}>Как это было?</Text>
            <Text style={styles.subtitle}>
              Зафиксируйте свои мысли, выводы или сложности при выполнении задачи
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Что получилось? Какой опыт извлекли?.."
              placeholderTextColor="#8E8E93"
              value={reflection}
              onChangeText={setReflection}
              autoFocus
            />
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={onSkip}
            >
              <Text style={styles.skipButtonText}>Пропустить</Text>
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
    backgroundColor: '#F2F2F7',
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
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C7C7CC',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#636366',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  inputContainer: {
    flex: 1,
    marginVertical: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    minHeight: 140,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
