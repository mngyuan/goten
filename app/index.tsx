import {useRouter} from 'expo-router';
import {NotebookPen} from 'lucide-react-native';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {DiaryDay} from '@/utils/diary';
import {getAllDiaryDays} from '@/utils/diary';

const WEEK_DAYS = ['月', '火', '水', '木', '金', '土', '日'];
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const H_PADDING = 24;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - H_PADDING * 2) / 8);
const CIRCLE_SIZE = CELL_SIZE - 4;

function buildWeeks(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDayNum = new Date(year, month, 0).getDate();
  // 0=Sun,1=Mon,...,6=Sat — if Sun, advance to next Mon; else step back to Mon
  const firstDow = firstDay.getDay();
  const startOffset = firstDow === 0 ? 1 : 1 - firstDow;
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();

  const weeks: {start: number; mondayDate: number; days: (number | null)[]}[] =
    [];
  for (let start = 1 + startOffset; start <= lastDayNum; start += 7) {
    const days: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const n = start + d;
      days.push(n >= 1 && n <= lastDayNum ? n : null);
    }
    const mondayDate = start < 1 ? prevMonthLastDay + start : start;
    weeks.push({start, mondayDate, days});
  }
  return weeks;
}

function MonthCalendar({
  month,
  allDays,
}: {
  month: string;
  allDays: Map<string, DiaryDay>;
}) {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  const weeks = buildWeeks(year, monthNum);

  return (
    <View style={styles.monthContainer}>
      <Text style={styles.monthTitle}>
        {year}年{monthNum}月
      </Text>
      {weeks.map((week, i) => (
        <View key={week.start} style={styles.weekRow}>
          <View style={styles.dateCell}>
            <Text style={styles.weekDateText}>
              {i !== 0 ? week.mondayDate : ''}
            </Text>
          </View>
          {week.days.map((day, i) => {
            if (day === null) {
              return <View key={i} style={styles.dayCell} />;
            }
            const iso = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
            const hasEntry = !!allDays
              .get(iso)
              ?.entries.some((e) => e.trim().length > 0);
            return (
              <View key={i} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayCircle,
                    hasEntry
                      ? styles.dayCircleActive
                      : styles.dayCircleInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      hasEntry ? styles.dayTextActive : styles.dayTextInactive,
                    ]}
                  >
                    {WEEK_DAYS[i]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const allDays = getAllDiaryDays();
  const allDates = Array.from(allDays.keys()).sort((a, b) =>
    b.localeCompare(a),
  );
  const allMonths = Array.from(new Set(allDates.map((d) => d.slice(0, 7))))
    .sort((a, b) => b.localeCompare(a))
    .reverse();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {allMonths.map((month) => (
          <MonthCalendar key={month} month={month} allDays={allDays} />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.diaryButton}
        onPress={() => router.push('/diary')}
      >
        <NotebookPen size={32} color="#fff" />
      </TouchableOpacity>
    </View>
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
  scrollContent: {
    padding: H_PADDING,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'medium',
  },
  monthContainer: {
    marginBottom: 32,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateCell: {
    width: CELL_SIZE,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  weekDateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#8DC890',
  },
  dayCircleInactive: {
    backgroundColor: '#DCDCDC',
  },
  dayText: {
    fontSize: Math.floor(CIRCLE_SIZE * 0.42),
    fontWeight: '500',
  },
  dayTextActive: {
    color: '#222',
  },
  dayTextInactive: {
    color: '#888',
  },
  diaryButton: {
    height: 60,
    width: 60,
    position: 'absolute',
    bottom: 30,
    right: 30,
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 30,
    alignItems: 'center',
  },
});
