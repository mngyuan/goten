import {useRouter} from 'expo-router';
import {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useModel} from '../providers/ModelProvider';
import Spinner from '../components/Spinner';
import {getTodayISO, getDiaryDay} from '../utils/diary';

export default function HomeScreen() {
  const router = useRouter();
  const llm = useModel();
  const [todayHasEntries, setTodayHasEntries] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDiaryDay(getTodayISO()).then((day) => {
        setTodayHasEntries(
          !!day && day.entries.some((e) => e.trim().length > 0),
        );
      });
    }, []),
  );

  if (!llm.isReady) {
    return (
      <Spinner
        visible={true}
        textContent={`Loading model ${(llm.downloadProgress * 100).toFixed(0)}%`}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Goten</Text>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.diaryButton}
          onPress={() => router.push('/diary')}
        >
          <Text style={styles.diaryButtonText}>
            {todayHasEntries ? "Today's Diary" : 'Start Writing'}
          </Text>
        </TouchableOpacity>
      </View>
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
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  diaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  diaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
