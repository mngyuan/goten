import {router, Tabs} from 'expo-router';
import {Database, FileInput} from 'lucide-react-native';

export default function TestscreenLayout() {
  if (!__DEV__) {
    router.back();
  }
  return (
    <Tabs screenOptions={{tabBarActiveTintColor: 'blue'}}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Importer',
          tabBarIcon: ({color}) => <FileInput size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="storage"
        options={{
          title: 'Storage',
          tabBarIcon: ({color}) => <Database size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
