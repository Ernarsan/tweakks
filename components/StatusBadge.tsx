import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TaskStatus } from '../lib/db';

interface StatusBadgeProps {
  status: TaskStatus;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  not_started: {
    label: 'Не начато',
    bg: '#E5E5EA',
    text: '#8E8E93',
  },
  in_progress: {
    label: 'В процессе',
    bg: '#E1EFFF',
    text: '#007AFF',
  },
  completed: {
    label: 'Выполнено',
    bg: '#E3F8E8',
    text: '#34C759',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
