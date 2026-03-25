import {Stack} from 'expo-router';
import DiaryProvider from '@/providers/DiaryProvider';

export default function DiaryLayout() {
  return (
    <DiaryProvider>
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="index" />
        <Stack.Screen name="review" />
      </Stack>
    </DiaryProvider>
  );
}
