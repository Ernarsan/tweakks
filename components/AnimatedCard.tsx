import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { THEME } from '../lib/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  elevated = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      stiffness: 400,
      damping: 20,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      stiffness: 300,
      damping: 18,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        elevated ? THEME.shadows.cardElevated : THEME.shadows.card,
        style,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.innerPressable}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  innerPressable: {
    padding: 16,
  },
});
