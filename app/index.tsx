import {useRouter} from 'expo-router';
import {NotebookPen} from 'lucide-react-native';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getDiaryDay, getTodayISO} from '@/utils/diary';

export default function HomeScreen() {
  const router = useRouter();
  const today = getDiaryDay(getTodayISO());
  const todayHasEntries =
    !!today && today.entries.some((e) => e.trim().length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Goten</Text>
      </View>
      <TouchableOpacity
        style={styles.diaryButton}
        onPress={() => router.push('/diary')}
      >
        <NotebookPen size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'medium',
  },
  diaryButton: {
    height: 60,
    width: 60,
    position: 'absolute',
    bottom: 30,
    right: 30,
    justifyContent: 'center',

    backgroundColor: '#007AFF',
    borderRadius: '50%',
    alignItems: 'center',
  },
  diaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
