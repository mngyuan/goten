import {useHeaderHeight} from '@react-navigation/elements';
import {useRouter} from 'expo-router';
import {useRef, useState} from 'react';
import {
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
import {getTodayISO} from '@/utils/diary';

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

const DayEditor = ({date}: {date: string}) => {
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
              onChangeText={(text) => updateEntry(date, index, text)}
              placeholder=""
              multiline={false}
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
  const todayISO = getTodayISO();
  const {getDay} = useDiary();

  const [editingDay, setEditingDay] = useState<string | null>(todayISO);

  // Compute days from start of week through today
  const weekDates: string[] = [];
  const todayDate = new Date(todayISO + 'T00:00:00');
  const dayOfWeek = todayDate.getDay();
  for (let i = 0; i <= dayOfWeek; i++) {
    const date = new Date(todayISO + 'T00:00:00');
    date.setDate(todayDate.getDate() - dayOfWeek + i);
    weekDates.push(date.toISOString().slice(0, 10));
  }

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
          {weekDates.length > 0 && (
            <Text style={styles.dateHeading}>
              {formatDateJapanese(weekDates[0])}から
            </Text>
          )}

          {weekDates.map((date) => {
            if (date === editingDay) {
              return <DayEditor key={date} date={date} />;
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
            style={styles.reviewButton}
            onPress={() => router.push('/diary/review')}
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
