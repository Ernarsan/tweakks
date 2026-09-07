import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ProgressBarProps {
  current: number;
  target: number;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  height = 8,
  style,
}) => {
  const safeTarget = target > 0 ? target : 1;
  const ratio = Math.max(0, Math.min(current / safeTarget, 1));
  const isCompleted = current >= target && target > 0;

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.round(ratio * 100)}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: isCompleted ? '#34C759' : '#007AFF',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
