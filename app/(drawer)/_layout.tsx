import {Drawer} from 'expo-router/drawer';
import React from 'react';

export default function Layout() {
  return (
    <Drawer>
      <Drawer.Screen name="index" options={{title: 'Goten'}} />
      <Drawer.Screen
        name="testscreen/(tabs)"
        options={{
          title: 'Testscreen',
          drawerItemStyle: __DEV__ ? undefined : {display: 'none'},
        }}
      />
      <Drawer.Screen name="settings" options={{title: 'Settings'}} />
    </Drawer>
  );
}
