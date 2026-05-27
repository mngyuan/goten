import {Asset} from 'expo-asset';
import {File} from 'expo-file-system';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {escapeRegExp} from '@/utils/regex';

type ExamplesContextType = {
  data: string[][];
  search: (query: string) => string[][];
};

const ExamplesContext = createContext<ExamplesContextType | null>(null);

export function useExamples() {
  const ctx = useContext(ExamplesContext);
  if (!ctx) {
    throw new Error('useExamples must be used within DiaryProvider');
  }
  return ctx;
}

export default function ExamplesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<string[][] | null>(null);

  useEffect(() => {
    (async () => {
      const [asset] = await Asset.loadAsync(require('@/assets/data/jpn.txt'));
      const text = await new File(asset.localUri ?? asset.uri).text();
      setData(text.split('\n').map((line) => line.split('\t')));
    })();
  }, []);

  const search = useCallback(
    (query: string) => {
      if (!data || !query.trim()) return [];
      const re = new RegExp('\\b' + escapeRegExp(query), 'i');
      return data.filter(([en, jp]) => re.test(jp ?? '') || re.test(en ?? ''));
    },
    [data],
  );

  const value = useMemo(() => (data ? {data, search} : null), [data, search]);

  if (!value) return <>{children}</>;
  return (
    <ExamplesContext.Provider value={value}>
      {children}
    </ExamplesContext.Provider>
  );
}
