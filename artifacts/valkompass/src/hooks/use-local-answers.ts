import { useState, useCallback, useRef } from 'react';
import { UserAnswer, QuizPayloadLevel } from '@workspace/api-client-react';

interface QuizState {
  answers: Record<string, UserAnswer>;
  currentQuestionIndex: number;
  isCompleted: boolean;
  lastUpdated?: number;
}

const DEFAULT_STATE: QuizState = { answers: {}, currentQuestionIndex: 0, isCompleted: false };

export function useStoredQuiz(level: QuizPayloadLevel) {
  const key = `valkompass-${level}`;
  
  const [state, setState] = useState<QuizState>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        return { ...DEFAULT_STATE, ...parsed };
      }
      return DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  // Persist synchronously and OUTSIDE React's state queue. Both useEffect and
  // setState-updater persistence lose the final update when a state change is
  // immediately followed by navigation: React may unmount the component before
  // the effect (or even the queued updater) runs, dropping the last answer and
  // the completed flag at the end of the quiz. So we mirror state in a ref,
  // compute the next value eagerly, write localStorage right away, then update
  // React state for rendering.
  const stateRef = useRef(state);
  const update = useCallback(
    (updater: (prev: QuizState) => QuizState) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      setState(next);
    },
    [key],
  );

  const setAnswer = useCallback((questionId: string, value: number | null, weight = 1) => {
    update((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: { 
          questionId, 
          value, 
          weight: prev.answers[questionId]?.weight ?? weight 
        },
      },
      lastUpdated: Date.now(),
    }));
  }, [update]);

  const setWeight = useCallback((questionId: string, weight: number) => {
    update((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: prev.answers[questionId]
          ? { ...prev.answers[questionId], weight }
          : { questionId, value: null, weight },
      },
      lastUpdated: Date.now(),
    }));
  }, [update]);

  const setCurrentIndex = useCallback((index: number) => {
    update((prev) => ({ ...prev, currentQuestionIndex: index }));
  }, [update]);

  const setCompleted = useCallback((completed: boolean) => {
    update((prev) => ({ ...prev, isCompleted: completed, lastUpdated: Date.now() }));
  }, [update]);

  const reset = useCallback(() => {
    update(() => DEFAULT_STATE);
  }, [update]);

  return { ...state, setAnswer, setWeight, setCurrentIndex, setCompleted, reset };
}

export function useAppStore() {
  const key = 'valkompass-app';
  const [state, setState] = useState<{
    municipalityId: string | null;
    resultTokens: Record<string, { editToken: string; deleteToken: string }>;
  }>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : { municipalityId: null, resultTokens: {} };
    } catch {
      return { municipalityId: null, resultTokens: {} };
    }
  });

  // Same ref-based synchronous persistence as useStoredQuiz (see comment above).
  const stateRef = useRef(state);
  const update = useCallback(
    (updater: (prev: { municipalityId: string | null; resultTokens: Record<string, { editToken: string; deleteToken: string }> }) => { municipalityId: string | null; resultTokens: Record<string, { editToken: string; deleteToken: string }> }) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      setState(next);
    },
    [],
  );

  const setMunicipalityId = useCallback((id: string | null) => {
    update((prev) => ({ ...prev, municipalityId: id }));
  }, [update]);

  const addResultToken = useCallback((slug: string, tokens: { editToken: string; deleteToken: string }) => {
    update((prev) => ({
      ...prev,
      resultTokens: { ...prev.resultTokens, [slug]: tokens },
    }));
  }, [update]);

  const removeResultToken = useCallback((slug: string) => {
    update((prev) => {
      const next = { ...prev.resultTokens };
      delete next[slug];
      return { ...prev, resultTokens: next };
    });
  }, [update]);

  return { ...state, setMunicipalityId, addResultToken, removeResultToken };
}
