import {useFocusEffect} from '@react-navigation/native';
import {useRouter} from 'expo-router';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type DiaryDay,
  getDiaryDay,
  getRecentDiaryDays,
  getTodayISO,
  saveDiaryDay,
} from '../utils/diary';
import { SafeAreaView } from 'react-native-safe-area-context';

const MAX_ENTRIES = 5;

function formatDateJapanese(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

function getDayOfWeekJapanese(dateStr: string): string {
  const days = [
    '日曜日',
    '月曜日',
    '火曜日',
    '水曜日',
    '木曜日',
    '金曜日',
    '土曜日',
  ];
  const date = new Date(dateStr + 'T00:00:00');
  return days[date.getDay()];
}

function getYesterdayISO(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DiaryScreen() {
  const router = useRouter();
  const todayISO = getTodayISO();
  const yesterdayISO = getYesterdayISO();

  const [entries, setEntries] = useState<string[]>(['']);
  const [previousDays, setPreviousDays] = useState<DiaryDay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [today, recent] = await Promise.all([
          getDiaryDay(todayISO),
          getRecentDiaryDays(7),
        ]);
        if (cancelled) return;

        if (today && today.entries.length > 0) {
          setEntries(today.entries);
        } else {
          setEntries(['']);
        }

        // Filter out today from previous days, show newest first
        const prev = recent.filter((d) => d.date !== todayISO).reverse();
        setPreviousDays(prev);
        setLoaded(true);
      })();
      return () => {
        cancelled = true;
      };
    }, [todayISO]),
  );

  // Auto-save with debounce
  useEffect(() => {
    if (!loaded) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDiaryDay({date: todayISO, entries});
    }, 500);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [entries, todayISO, loaded]);

  const updateEntry = (index: number, text: string) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const addEntry = () => {
    if (entries.length >= MAX_ENTRIES) return;
    setEntries((prev) => [...prev, '']);
    // Focus the new input after render
    setTimeout(() => {
      inputRefs.current[entries.length]?.focus();
    }, 100);
  };

  const hasEntries = entries.some((e) => e.trim().length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.back()}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date heading */}
        <Text style={styles.dateHeading}>{formatDateJapanese(todayISO)}</Text>
        <Text style={styles.yesterdayDay}>
          {getDayOfWeekJapanese(yesterdayISO)}
        </Text>
        <Text style={styles.todayDay}>{getDayOfWeekJapanese(todayISO)}</Text>

        {/* Today's entries */}
        <View style={styles.entriesSection}>
          {entries.map((entry, index) => (
            <View key={index} style={styles.entryRow}>
              <Text style={styles.entryNumber}>{index + 1}.</Text>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.entryInput}
                value={entry}
                onChangeText={(text) => updateEntry(index, text)}
                placeholder=""
                multiline={false}
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                }}
              />
            </View>
          ))}
          {entries.length < MAX_ENTRIES && (
            <TouchableOpacity style={styles.addButton} onPress={addEntry}>
              <Text style={styles.addButtonText}>⊕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Previous days */}
        {previousDays.map((day) => (
          <View key={day.date} style={styles.previousDay}>
            <Text style={styles.previousDateHeading}>
              {formatDateJapanese(day.date)}
            </Text>
            <Text style={styles.previousDayName}>
              {getDayOfWeekJapanese(day.date)}
            </Text>
            {day.entries
              .filter((e) => e.trim().length > 0)
              .map((entry, index) => (
                <View key={index} style={styles.previousEntryRow}>
                  <Text style={styles.previousEntryNumber}>{index + 1}.</Text>
                  <Text style={styles.previousEntryText}>{entry}</Text>
                </View>
              ))}
          </View>
        ))}

        {/* Review button */}
        {hasEntries && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => router.push('/review')}
          >
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Dictionary panel stub */}
      <View style={styles.dictionaryStub}>
        <TouchableOpacity
          style={[styles.dictionaryTab, styles.dictionaryTabActive]}
        >
          <Text style={styles.dictionaryTabText}>Dictionary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dictionaryTab}>
          <Text style={styles.dictionaryTabText}>Examples</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  dateHeading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
  yesterdayDay: {
    fontSize: 18,
    color: '#ccc',
    marginTop: 2,
  },
  todayDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  entriesSection: {
    marginBottom: 24,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 4,
    width: 24,
  },
  entryInput: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 4,
  },
  addButton: {
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 28,
    color: '#000',
  },
  previousDay: {
    marginTop: 24,
    opacity: 0.6,
  },
  previousDateHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  previousDayName: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  previousEntryRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  previousEntryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 4,
    width: 24,
  },
  previousEntryText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  reviewButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginHorizontal: 16,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 60,
  },
  dictionaryStub: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  dictionaryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dictionaryTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  dictionaryTabText: {
    fontSize: 14,
    color: '#000',
  },
});
