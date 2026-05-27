import {Stack} from 'expo-router';
import {Drawer} from 'expo-router/drawer';
import React from 'react';
import DiaryProvider from '@/providers/DiaryProvider';
import ModelProvider from '@/providers/ModelProvider';

export default function RootLayout() {
  return (
    <ModelProvider>
      <DiaryProvider>
        <Stack screenOptions={{headerShown: false}}>
          <Stack.Screen name="index" />
          <Stack.Screen name="diary" />
        </Stack>
      </DiaryProvider>
    </ModelProvider>
  );
}
