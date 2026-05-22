import {createMMKV} from 'react-native-mmkv';

export const diaryStorage = createMMKV({id: 'diary'});

export type DiaryDay = {
  date: string; // ISO date string YYYY-MM-DD
  entries: string[];
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

function normalizeDigits(s: string): string {
  return s.replace(/[０-９]/gu, c =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
}

function parseOrdinal(s: string): number | null {
  const normalized = normalizeDigits(s);
  if (/^\d+$/.test(normalized)) return parseInt(normalized, 10);

  const singles: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9,
  };

  let n = 0;
  let i = 0;

  if (singles[s[i]] !== undefined && s[i + 1] === '十') {
    n = singles[s[i]] * 10;
    i += 2;
  } else if (s[i] === '十') {
    n = 10;
    i++;
  }

  if (i < s.length && singles[s[i]] !== undefined) {
    n += singles[s[i]];
    i++;
  }

  if (i === 0 && singles[s[0]] !== undefined) {
    return singles[s[0]];
  }

  return n > 0 ? n : null;
}

function isoFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function importDiaryText(raw: string): void {
  const lines = raw.split(/\r?\n/);

  let startDate: Date | null = null;
  let currentDayOffset: number | null = null;
  let currentEntries: string[] = [];

  const flush = () => {
    if (startDate !== null && currentDayOffset !== null && currentEntries.length > 0) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + currentDayOffset);
      saveDiaryDay({date: isoFromDate(date), entries: currentEntries});
    }
    currentEntries = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const startMatch = normalizeDigits(line).match(/(\d{4})年(\d{1,2})月(\d{1,2})日から/);
    if (startMatch) {
      flush();
      const [, y, m, d] = startMatch;
      startDate = new Date(
        `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`,
      );
      currentDayOffset = null;
      continue;
    }

    const dayMatch = line.match(/^([\p{Nd}一二三四五六七八九十]+)日目/u);
    if (dayMatch) {
      flush();
      const ordinal = parseOrdinal(dayMatch[1]);
      if (ordinal !== null) currentDayOffset = ordinal - 1;
      continue;
    }

    const entryMatch = line.match(/^\p{Nd}+[.．]\s*(.+)$/u);
    if (entryMatch) currentEntries.push(entryMatch[1]);
  }

  flush();
}
