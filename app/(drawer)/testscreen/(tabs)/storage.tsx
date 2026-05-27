import {useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDiary} from '@/providers/DiaryProvider';
import {diaryStorage} from '@/utils/diary';

export default function StorageScreen() {
  const {refresh} = useDiary();
  const [tick, setTick] = useState(0);

  const allKeys = diaryStorage.getAllKeys().sort((a, b) => b.localeCompare(a));

  const handleClear = () => {
    Alert.alert(
      'Clear Storage',
      'Clear all diary MMKV storage? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            diaryStorage.clearAll();
            refresh();
            setTick((t) => t + 1);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>MMKV Storage</Text>
          <Text style={styles.subtitle}>{allKeys.length} keys stored</Text>

          <View style={styles.group}>
            {allKeys.map((key, index) => {
              const raw =
                diaryStorage.getString(key) ??
                diaryStorage.getNumber(key) ??
                diaryStorage.getBoolean(key);
              let value: string;
              try {
                value = JSON.stringify(JSON.parse(String(raw)), null, 2);
              } catch {
                value = String(raw);
              }
              return (
                <View key={key}>
                  {index > 0 && <View style={styles.separator} />}
                  <View style={styles.row}>
                    <Text style={styles.key}>{key}</Text>
                    <Text style={styles.value}>{String(value)}</Text>
                  </View>
                </View>
              );
            })}
            {allKeys.length === 0 && (
              <Text style={styles.emptyText}>No keys in storage</Text>
            )}
          </View>

          <Pressable style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear All Storage</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: -8,
  },
  group: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  row: {
    paddingVertical: 12,
  },
  key: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  value: {
    fontSize: 14,
    color: '#0066CC',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
