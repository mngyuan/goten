import {useHeaderHeight} from '@react-navigation/elements';
import {useFocusEffect} from '@react-navigation/native';
import {useRouter} from 'expo-router';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  type DiaryDay,
  getDiaryDay,
  getDiaryWeek,
  getRecentDiaryDays,
  getTodayISO,
  saveDiaryDay,
} from '@/utils/diary';

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

const DayEditor = ({day}: {day: DiaryDay}) => {
  const [entries, setEntries] = useState<string[]>(['']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDiaryDay({date: day.date, entries});
    }, 500);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [entries, day.date]);

  return (
    <>
      {/* Date heading */}
      <View style={styles.header}>
        <Text style={styles.dateHeading}>{formatDateJapanese(day.date)}</Text>
        <Text style={styles.todayDay}>{getDayOfWeekJapanese(day.date)}</Text>
      </View>
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
    </>
  );
};

export default function DiaryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const height = useHeaderHeight();
  const todayISO = getTodayISO();

  const [weekDays, setWeekDays] = useState<DiaryDay[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const daysSinceStartOfWeek = Array(
        new Date(todayISO + 'T00:00:00').getDay() + 1,
      )
        .fill(0)
        .map((_, i) => {
          const date = new Date(todayISO + 'T00:00:00');
          date.setDate(date.getDate() - (date.getDay() - i));
          return date.toISOString().slice(0, 10);
        });

      // Load each diary entry for each day since the start of the week
      let cancelled = false;
      (async () => {
        const thisWeek = await Promise.all(
          daysSinceStartOfWeek.map(
            async (date) => (await getDiaryDay(date)) || {date, entries: ['']},
          ),
        );

        if (cancelled) return;
        setWeekDays(thisWeek);
        setLoaded(true);
      })();
      return () => {
        cancelled = true;
      };
    }, [todayISO]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <ScrollView
          style={[
            styles.scrollView,
            {backgroundColor: colorScheme === 'dark' ? '#000' : '#fff'},
          ]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {weekDays.map((day) => (
            <DayEditor key={day.date} day={day} />
          ))}

          {weekDays.map((day) => (
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

          <View style={{flexGrow: 1}} />

          {/* Review button */}
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => router.push('/diary/review')}
          >
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Dictionary panel stub */}
        <View
          style={[
            styles.dictionaryStub,
            {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
              borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.dictionaryTab,
              styles.dictionaryTabActive,
              {borderBottomColor: colorScheme === 'dark' ? '#fff' : '#000'},
            ]}
          >
            <Text>Dictionary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dictionaryTab}>
            <Text style={styles.dictionaryTabText}>Examples</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
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
    paddingVertical: 16,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexDirection: 'column',
    flexGrow: 1,
    paddingBottom: 16,
  },
  dateHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
  todayDay: {
    fontSize: 24,
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
    marginTop: 16,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dictionaryStub: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  dictionaryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dictionaryTabActive: {
    borderBottomWidth: 2,
  },
  dictionaryTabText: {
    fontSize: 14,
  },
});
