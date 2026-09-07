import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TaskStatus } from '../lib/db';
import { Theme } from '../lib/theme';

interface StatusBadgeProps {
  status: TaskStatus;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  not_started: {
    label: 'Не начато',
    bg: 'rgba(100, 116, 139, 0.12)',
    text: '#94A3B8',
    dot: '#64748B',
    border: 'rgba(100, 116, 139, 0.25)',
  },
  in_progress: {
    label: 'В процессе',
    bg: 'rgba(99, 102, 241, 0.14)',
    text: '#A5B4FC',
    dot: '#6366F1',
    border: 'rgba(99, 102, 241, 0.35)',
  },
  completed: {
    label: 'Выполнено',
    bg: 'rgba(16, 185, 129, 0.14)',
    text: '#6EE7B7',
    dot: '#10B981',
    border: 'rgba(16, 185, 129, 0.35)',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radii.full,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
