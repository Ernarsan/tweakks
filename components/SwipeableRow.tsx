import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../lib/theme';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onPress: () => void;
  confirmTitle?: string;
  confirmMessage?: string;
}

const BUTTON_WIDTH = 84;

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  onPress,
  confirmTitle = 'Удалить задачу?',
  confirmMessage = 'Это действие нельзя отменить.',
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

  const confirmDelete = () => {
    closeRow();
    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const closeRow = () => {
    isOpenRef.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      stiffness: 350,
      damping: 24,
      useNativeDriver: true,
    }).start();
  };

  const openRow = () => {
    isOpenRef.current = true;
    Animated.spring(translateX, {
      toValue: -BUTTON_WIDTH,
      stiffness: 350,
      damping: 24,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx;
        if (isOpenRef.current) {
          newX -= BUTTON_WIDTH;
        }
        if (newX > 0) {
          newX = newX * 0.2; // сопротивление вправо
        } else if (newX < -BUTTON_WIDTH * 1.5) {
          newX = -BUTTON_WIDTH * 1.5 + (newX + BUTTON_WIDTH * 1.5) * 0.2;
        }
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        let finalX = gestureState.dx;
        if (isOpenRef.current) {
          finalX -= BUTTON_WIDTH;
        }

        if (finalX < -BUTTON_WIDTH / 2) {
          openRow();
        } else {
          closeRow();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.actionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteText}>Удалить</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={styles.pressable}
          onPress={() => {
            if (isOpenRef.current) {
              closeRow();
            } else {
              onPress();
            }
          }}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: THEME.radii.lg,
    marginBottom: 12,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.destructive,
    borderTopRightRadius: THEME.radii.lg,
    borderBottomRightRadius: THEME.radii.lg,
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  content: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
  },
  pressable: {
    borderRadius: THEME.radii.lg,
  },
});
