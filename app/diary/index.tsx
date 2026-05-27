import {useHeaderHeight} from '@react-navigation/elements';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useMemo, useRef, useState} from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDiary} from '@/providers/DiaryProvider';
import {useExamples} from '@/providers/ExamplesProvider';
import {getTodayISO} from '@/utils/diary';
import {escapeRegExp} from '@/utils/regex';

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

const DayEditor = ({
  date,
  onActiveEntryChange,
}: {
  date: string;
  onActiveEntryChange: (text: string) => void;
}) => {
  const {getDay, updateEntry, addEntry} = useDiary();
  const day = getDay(date);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleAddEntry = () => {
    if (day.entries.length >= MAX_ENTRIES) return;
    addEntry(date);
    setTimeout(() => {
      inputRefs.current[day.entries.length]?.focus();
    }, 100);
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.todayDay}>{getDayOfWeekJapanese(date)}</Text>
      </View>
      <View style={styles.entriesSection}>
        {day.entries.map((entry, index) => (
          <View key={index} style={styles.entryRow}>
            <Text style={styles.entryNumber}>{index + 1}.</Text>
            <TextInput
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.entryInput}
              value={entry}
              onChangeText={(text) => {
                updateEntry(date, index, text);
                onActiveEntryChange(text);
              }}
              onFocus={() => onActiveEntryChange(entry)}
              onBlur={() => onActiveEntryChange('')}
              placeholder=""
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
              }}
            />
          </View>
        ))}
        {day.entries.length < MAX_ENTRIES && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
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
  const {date: dateISO} = useLocalSearchParams<{date?: string}>();
  const todayISO = getTodayISO();
  const {getDay} = useDiary();

  const [editingDay, setEditingDay] = useState<string | null>(
    dateISO ?? todayISO,
  );
  const [activeEntryText, setActiveEntryText] = useState('');
  const {search} = useExamples();

  const query = useMemo(() => {
    const match = activeEntryText.match(/[A-Za-z ]+$/);
    return match ? match[0] : '';
  }, [activeEntryText]);

  const suggestions = useMemo(
    () => (query ? search(query) : []),
    [query, search],
  );

  const weekDates: string[] = [];
  if (dateISO) {
    // Compute days of the week dateISO is in
    // Convert to UTC date otherwise new Date(dateISO) could be like
    // <previous date>T23:00:00 in BST
    const [yearStr, monthStr, dayStr] = dateISO.split('-').map(Number);
    const date = new Date(Date.UTC(yearStr, monthStr - 1, dayStr));
    date.setDate(date.getDate() - date.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(date);
      d.setDate(date.getDate() + i);
      weekDates.push(d.toISOString().slice(0, 10));
    }
  } else {
    // Compute days from start of week through today
    const todayDate = new Date(todayISO + 'T00:00:00');
    const dayOfWeek = todayDate.getDay();
    for (let i = 0; i <= dayOfWeek; i++) {
      const date = new Date(todayISO + 'T00:00:00');
      date.setDate(todayDate.getDate() - dayOfWeek + i);
      weekDates.push(date.toISOString().slice(0, 10));
    }
  }

  const hasEntries = weekDates.some((date) => {
    const day = getDay(date);
    return day.entries.some((e) => e.trim().length > 0);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          {weekDates.length > 0 && (
            <Text style={styles.dateHeading}>
              {formatDateJapanese(weekDates[0])}から
            </Text>
          )}

          {weekDates.map((date) => {
            if (date === editingDay) {
              return (
                <DayEditor
                  key={date}
                  date={date}
                  onActiveEntryChange={setActiveEntryText}
                />
              );
            }
            const day = getDay(date);
            return (
              <Pressable key={date} onPress={() => setEditingDay(date)}>
                <View style={styles.previousDay}>
                  <Text style={styles.previousDayName}>
                    {getDayOfWeekJapanese(date)}
                  </Text>
                  {day.entries
                    .filter((e) => e.trim().length > 0)
                    .map((entry, index) => (
                      <View key={index} style={styles.previousEntryRow}>
                        <Text style={styles.previousEntryNumber}>
                          {index + 1}.
                        </Text>
                        <Text style={styles.previousEntryText}>{entry}</Text>
                      </View>
                    ))}
                </View>
              </Pressable>
            );
          })}

          <View style={{flexGrow: 1}} />

          <TouchableOpacity
            style={[styles.reviewButton, !hasEntries && {opacity: 0.5}]}
            onPress={() => router.push('/diary/review')}
            disabled={!hasEntries}
          >
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
        </ScrollView>

        <View
          style={[
            styles.dictionaryStub,
            {
              backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
              borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
            },
          ]}
        >
          <TouchableOpacity style={styles.dictionaryTab}>
            <Text style={styles.dictionaryTabText}>Dictionary</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dictionaryTab,
              styles.dictionaryTabActive,
              {borderBottomColor: colorScheme === 'dark' ? '#fff' : '#000'},
            ]}
          >
            <Text>Examples</Text>
          </TouchableOpacity>
        </View>

        {suggestions.length > 0 && (
          <FlatList
            style={[
              styles.suggestions,
              {
                backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
                borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
              },
            ]}
            data={suggestions}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(_, i) => String(i)}
            renderItem={({item: [en, jp]}) => (
              <View style={styles.suggestionRow}>
                <Text
                  style={[
                    styles.suggestionJp,
                    {color: colorScheme === 'dark' ? '#fff' : '#000'},
                  ]}
                >
                  {jp}
                </Text>
                <Text
                  style={[
                    styles.suggestionEn,
                    {color: colorScheme === 'dark' ? '#aaa' : '#666'},
                  ]}
                >
                  {console.log({en, query}) ||
                    (query
                      ? en.split(
                          new RegExp('(\\b' + escapeRegExp(query) + ')', 'i'),
                        )
                      : [en]
                    ).map((part, i) =>
                      i % 2 === 1 ? (
                        <Text key={i} style={[styles.suggestionEnMatch]}>
                          {part}
                        </Text>
                      ) : (
                        part
                      ),
                    )}
                </Text>
              </View>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
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
    marginBottom: 4,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 4,
    paddingTop: 4,
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
    marginBottom: 24,
    opacity: 0.6,
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
  suggestions: {
    maxHeight: '50%',
    borderTopWidth: 1,
  },
  suggestionRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionJp: {
    fontSize: 16,
  },
  suggestionEn: {
    fontSize: 13,
    marginTop: 2,
  },
  suggestionEnMatch: {
    fontWeight: '700',
    color: '#007AFF',
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
