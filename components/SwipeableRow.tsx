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
import { Theme } from '../lib/theme';

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
  const scale = useRef(new Animated.Value(1)).current;
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
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const openRow = () => {
    isOpenRef.current = true;
    Animated.spring(translateX, {
      toValue: -BUTTON_WIDTH,
      useNativeDriver: true,
      bounciness: 4,
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
          newX = newX * 0.2;
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

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Кнопка удаления сзади */}
      <View style={styles.actionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteText}>Удалить</Text>
        </Pressable>
      </View>

      {/* Карточка */}
      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateX }, { scale }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={styles.pressable}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
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
    borderRadius: Theme.radii.lg,
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
    backgroundColor: '#DC2626',
    borderTopRightRadius: Theme.radii.lg,
    borderBottomRightRadius: Theme.radii.lg,
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  content: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  pressable: {
    borderRadius: Theme.radii.lg,
  },
});
