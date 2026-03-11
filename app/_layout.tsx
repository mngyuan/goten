import {Stack} from 'expo-router';
import React from 'react';
import ModelProvider from '../providers/ModelProvider';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <ModelProvider>
      <Drawer>
        <Drawer.Screen name="index" options={{ title: 'Home' }} />
        <Drawer.Screen name="entry/[id]" options={{ title: 'Entry' }} />
        <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
        </Drawer>
    </ModelProvider>
  );
}
