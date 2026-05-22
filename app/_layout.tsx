import {Drawer} from 'expo-router/drawer';
import React from 'react';
import DiaryProvider from '../providers/DiaryProvider';
import ModelProvider from '../providers/ModelProvider';

export default function RootLayout() {
  return (
    <ModelProvider>
      <DiaryProvider>
        <Drawer>
          <Drawer.Screen name="index" options={{title: 'Goten'}} />
          <Drawer.Screen name="diary" options={{title: 'Diary'}} />
          <Drawer.Screen name="settings" options={{title: 'Settings'}} />
          <Drawer.Screen
            name="testscreen/(tabs)"
            options={{
              title: 'Testscreen',
              drawerItemStyle: __DEV__ ? undefined : {display: 'none'},
            }}
          />
        </Drawer>
      </DiaryProvider>
    </ModelProvider>
  );
}
