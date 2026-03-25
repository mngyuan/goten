import type React from 'react';
import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {
  type DiaryDay,
  getAllDiaryDays,
  saveDiaryDay,
} from '@/utils/diary';

const MAX_ENTRIES = 5;

type DiaryContextType = {
  days: Map<string, DiaryDay>;
  getDay: (date: string) => DiaryDay;
  updateEntry: (date: string, index: number, text: string) => void;
  addEntry: (date: string) => void;
};

const DiaryContext = createContext<DiaryContextType | null>(null);

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) {
    throw new Error('useDiary must be used within DiaryProvider');
  }
  return ctx;
}

export default function DiaryProvider({
  children,
}: {children: React.ReactNode}) {
  const [days, setDays] = useState<Map<string, DiaryDay>>(
    () => getAllDiaryDays(),
  );
  const saveTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const getDay = useCallback(
    (date: string): DiaryDay => {
      return days.get(date) || {date, entries: ['']};
    },
    [days],
  );

  const scheduleSave = useCallback((day: DiaryDay) => {
    const existing = saveTimeouts.current.get(day.date);
    if (existing) clearTimeout(existing);
    saveTimeouts.current.set(
      day.date,
      setTimeout(() => {
        saveDiaryDay(day);
        saveTimeouts.current.delete(day.date);
      }, 500),
    );
  }, []);

  const updateEntry = useCallback(
    (date: string, index: number, text: string) => {
      setDays((prev) => {
        const next = new Map(prev);
        const day = next.get(date) || {date, entries: ['']};
        const entries = [...day.entries];
        entries[index] = text;
        const updated = {...day, entries};
        next.set(date, updated);
        scheduleSave(updated);
        return next;
      });
    },
    [scheduleSave],
  );

  const addEntry = useCallback(
    (date: string) => {
      setDays((prev) => {
        const next = new Map(prev);
        const day = next.get(date) || {date, entries: ['']};
        if (day.entries.length >= MAX_ENTRIES) return prev;
        const updated = {...day, entries: [...day.entries, '']};
        next.set(date, updated);
        scheduleSave(updated);
        return next;
      });
    },
    [scheduleSave],
  );

  useEffect(() => {
    return () => {
      for (const timeout of saveTimeouts.current.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);

  return (
    <DiaryContext value={{days, getDay, updateEntry, addEntry}}>
      {children}
    </DiaryContext>
  );
}
