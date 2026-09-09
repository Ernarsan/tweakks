import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TaskStatus } from '../lib/db';
import { THEME } from '../lib/theme';

interface StatusBadgeProps {
  status: TaskStatus;
  style?: ViewStyle;
  showDot?: boolean;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  not_started: {
    label: 'Не начато',
    bg: THEME.colors.notStartedLight,
    text: THEME.colors.textSecondary,
    border: THEME.colors.notStartedBorder,
    dot: THEME.colors.notStarted,
  },
  in_progress: {
    label: 'В процессе',
    bg: THEME.colors.inProgressLight,
    text: THEME.colors.inProgress,
    border: THEME.colors.inProgressBorder,
    dot: THEME.colors.inProgress,
  },
  completed: {
    label: 'Выполнено',
    bg: THEME.colors.successLight,
    text: THEME.colors.success,
    border: THEME.colors.successBorder,
    dot: THEME.colors.success,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  style,
  showDot = true,
}) => {
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
      {showDot && <View style={[styles.dot, { backgroundColor: config.dot }]} />}
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
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
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
