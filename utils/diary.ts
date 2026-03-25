import {createMMKV} from 'react-native-mmkv';

export const diaryStorage = createMMKV({id: 'diary'});

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

export function getDiaryDay(date: string): DiaryDay | null {
  const raw = diaryStorage.getString(diaryKey(date));
  if (!raw) return null;
  return JSON.parse(raw) as DiaryDay;
}

export function saveDiaryDay(day: DiaryDay): void {
  diaryStorage.set(diaryKey(day.date), JSON.stringify(day));

  const indexRaw = diaryStorage.getString(DIARY_INDEX_KEY);
  const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
  if (!index.includes(day.date)) {
    index.push(day.date);
    index.sort();
    diaryStorage.set(DIARY_INDEX_KEY, JSON.stringify(index));
  }
}

export function getDiaryIndex(): string[] {
  const raw = diaryStorage.getString(DIARY_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getAllDiaryDays(): Map<string, DiaryDay> {
  const index = getDiaryIndex();
  const days = new Map<string, DiaryDay>();
  for (const date of index) {
    const day = getDiaryDay(date);
    if (day) days.set(date, day);
  }
  return days;
}
