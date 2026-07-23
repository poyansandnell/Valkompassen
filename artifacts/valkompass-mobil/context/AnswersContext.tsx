import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoredAnswer, TopMatchSummary } from '@/lib/quiz';

const STORAGE_KEY = 'valkompass-state-v1';

export interface LevelState {
  answers: Record<string, StoredAnswer>;
  municipalityId?: string | null;
  municipalityName?: string | null;
  totalQuestions?: number;
  topMatch?: TopMatchSummary | null;
}

type StateMap = Record<string, LevelState>;

interface AnswersContextValue {
  hydrated: boolean;
  data: StateMap;
  getLevel: (key: string) => LevelState;
  setAnswer: (key: string, questionId: string, answer: StoredAnswer) => void;
  setLevelMeta: (key: string, meta: Partial<Omit<LevelState, 'answers'>>) => void;
  clearLevel: (key: string) => void;
  /** Rensar allt sparat för en nivå (alla kommuner/regioner), t.ex. vid "Gör om". */
  clearLevelAll: (level: string) => void;
}

const EMPTY_LEVEL: LevelState = { answers: {} };

const AnswersContext = createContext<AnswersContextValue | null>(null);

export function AnswersProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StateMap>({});
  const [hydrated, setHydrated] = useState<boolean>(false);
  // Ref mirror: compute next state from the ref and persist immediately,
  // so no update is lost if the screen unmounts before React flushes.
  const dataRef = useRef<StateMap>({});

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as StateMap;
            dataRef.current = { ...parsed, ...dataRef.current };
            setData(dataRef.current);
          } catch {
            // corrupt state — start fresh
          }
        }
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: StateMap) => {
    dataRef.current = next;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    setData(next);
  }, []);

  const getLevel = useCallback(
    (key: string): LevelState => data[key] ?? EMPTY_LEVEL,
    [data],
  );

  const setAnswer = useCallback(
    (key: string, questionId: string, answer: StoredAnswer) => {
      const current = dataRef.current[key] ?? { answers: {} };
      const next: StateMap = {
        ...dataRef.current,
        [key]: {
          ...current,
          answers: { ...current.answers, [questionId]: answer },
        },
      };
      commit(next);
    },
    [commit],
  );

  const setLevelMeta = useCallback(
    (key: string, meta: Partial<Omit<LevelState, 'answers'>>) => {
      const current = dataRef.current[key] ?? { answers: {} };
      commit({ ...dataRef.current, [key]: { ...current, ...meta } });
    },
    [commit],
  );

  const clearLevel = useCallback(
    (key: string) => {
      const next = { ...dataRef.current };
      delete next[key];
      commit(next);
    },
    [commit],
  );

  const clearLevelAll = useCallback(
    (level: string) => {
      const next: StateMap = {};
      for (const [k, v] of Object.entries(dataRef.current)) {
        if (!k.startsWith(`${level}:`)) next[k] = v;
      }
      commit(next);
    },
    [commit],
  );

  return (
    <AnswersContext.Provider
      value={{ hydrated, data, getLevel, setAnswer, setLevelMeta, clearLevel, clearLevelAll }}
    >
      {children}
    </AnswersContext.Provider>
  );
}

export function useAnswers(): AnswersContextValue {
  const ctx = useContext(AnswersContext);
  if (!ctx) throw new Error('useAnswers must be used within AnswersProvider');
  return ctx;
}
