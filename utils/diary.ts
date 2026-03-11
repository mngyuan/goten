import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiaryDay = {
  date: string; // ISO date string YYYY-MM-DD
  entries: string[]; // max 5 items
};

const DIARY_INDEX_KEY = 'diary:index';

function diaryKey(date: string): string {
  return `diary:${date}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/*
 * Returns the diary day for the given date, or null if not found.
 */
export async function getDiaryDay(date: string): Promise<DiaryDay | null> {
  const raw = await AsyncStorage.getItem(diaryKey(date));
  if (!raw) return null;
  return JSON.parse(raw) as DiaryDay;
}

export async function saveDiaryDay(day: DiaryDay): Promise<void> {
  await AsyncStorage.setItem(diaryKey(day.date), JSON.stringify(day));

  // Update index
  const indexRaw = await AsyncStorage.getItem(DIARY_INDEX_KEY);
  const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
  if (!index.includes(day.date)) {
    index.push(day.date);
    index.sort();
    await AsyncStorage.setItem(DIARY_INDEX_KEY, JSON.stringify(index));
  }
}

/*
 * Returns a list of all diary dates in ISO format, sorted ascending.
 */
export async function getDiaryIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DIARY_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function getRecentDiaryDays(limit = 7): Promise<DiaryDay[]> {
  const index = await getDiaryIndex();
  const recentDates = index.slice(-limit);
  const days: DiaryDay[] = [];
  for (const date of recentDates) {
    const day = await getDiaryDay(date);
    if (day) days.push(day);
  }
  return days;
}

export async function getDiaryWeek(date: string): Promise<DiaryDay[]> {
  const target = new Date(date + 'T00:00:00');
  const dayOfWeek = target.getDay();
  const start = new Date(target);
  start.setDate(target.getDate() - dayOfWeek);
  const week: DiaryDay[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const iso = current.toISOString().slice(0, 10);
    const day = await getDiaryDay(iso);
    if (day) week.push(day);
  }
  return week;
}
