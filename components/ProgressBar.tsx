import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { THEME } from '../lib/theme';

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

  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: ratio,
      stiffness: 180,
      damping: 22,
      useNativeDriver: false,
    }).start();
  }, [ratio, animatedWidth]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolation,
            height,
            borderRadius: height / 2,
            backgroundColor: isCompleted
              ? THEME.colors.success
              : THEME.colors.primary,
          },
          isCompleted && THEME.shadows.glowEmerald,
        ]}
      >
        {/* Внутренний светящийся блик в стиле Aceternity */}
        <View style={styles.sheen} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'relative',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
