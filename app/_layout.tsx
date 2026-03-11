import {Drawer} from 'expo-router/drawer';
import React from 'react';
import ModelProvider from '../providers/ModelProvider';

export default function RootLayout() {
  return (
    <ModelProvider>
      <Drawer>
        <Drawer.Screen name="index" options={{title: 'Goten'}} />
        <Drawer.Screen name="diary" options={{title: 'Diary'}} />
        <Drawer.Screen name="settings" options={{title: 'Settings'}} />
      </Drawer>
    </ModelProvider>
  );
}
