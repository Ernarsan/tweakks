import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../../lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: THEME.colors.card,
          borderTopColor: THEME.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: THEME.colors.card,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 19,
          color: THEME.colors.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Задачи',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Цели',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'flag' : 'flag-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
