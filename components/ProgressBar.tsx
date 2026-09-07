import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../lib/theme';

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

  const animatedWidth = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: ratio,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [ratio]);

  const widthInterpolated = animatedWidth.interpolate({
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
          styles.fillContainer,
          {
            width: widthInterpolated,
            height,
            borderRadius: height / 2,
          },
        ]}
      >
        <LinearGradient
          colors={
            isCompleted
              ? (['#10B981', '#34D399'] as [string, string])
              : (['#6366F1', '#8B5CF6'] as [string, string])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { borderRadius: height / 2 }]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  fillContainer: {
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
