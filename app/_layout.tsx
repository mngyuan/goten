import {Stack} from 'expo-router';
import React from 'react';
import ModelProvider from '../providers/ModelProvider';

export default function RootLayout() {
  return (
    <ModelProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="diary" />
        <Stack.Screen name="review" />
      </Stack>
    </ModelProvider>
  );
}
