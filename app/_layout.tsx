import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../lib/db';
import { Theme } from '../lib/theme';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('Ошибка инициализации базы данных:', err);
        setError('Не удалось подключиться к базе данных');
      });
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0B0F19',
          },
          headerTintColor: '#818CF8',
          headerTitleStyle: {
            fontWeight: '700',
            color: '#F8FAFC',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: '#0B0F19',
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            title: 'Задача',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="task/new"
          options={{
            title: 'Новая задача',
            presentation: 'modal',
            headerBackTitle: 'Отмена',
          }}
        />
        <Stack.Screen
          name="goal/[id]"
          options={{
            title: 'Цель',
            headerBackTitle: 'Назад',
          }}
        />
        <Stack.Screen
          name="goal/new"
          options={{
            title: 'Новая цель',
            presentation: 'modal',
            headerBackTitle: 'Отмена',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F19',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});
