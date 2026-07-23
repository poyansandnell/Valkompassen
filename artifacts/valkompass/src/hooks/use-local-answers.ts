import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserAnswer, QuizPayloadLevel } from '@workspace/api-client-react';

interface QuizState {
  answers: Record<string, UserAnswer>;
  currentQuestionIndex: number;
}

const DEFAULT_STATE: QuizState = { answers: {}, currentQuestionIndex: 0 };

function useStoredQuiz(level: QuizPayloadLevel) {
  const key = `valkompass-${level}`;
  
  const [state, setState] = useState<QuizState>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  const setAnswer = useCallback((questionId: string, value: number | null, weight = 1) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: { 
          questionId, 
          value, 
          weight: prev.answers[questionId]?.weight ?? weight 
        },
      },
    }));
  }, []);

  const setWeight = useCallback((questionId: string, weight: number) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: prev.answers[questionId]
          ? { ...prev.answers[questionId], weight }
          : { questionId, value: null, weight },
      },
    }));
  }, []);

  const setCurrentIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, currentQuestionIndex: index }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return { ...state, setAnswer, setWeight, setCurrentIndex, reset };
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

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [state]);

  const setMunicipalityId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, municipalityId: id }));
  }, []);

  const addResultToken = useCallback((slug: string, tokens: { editToken: string; deleteToken: string }) => {
    setState((prev) => ({
      ...prev,
      resultTokens: { ...prev.resultTokens, [slug]: tokens },
    }));
  }, []);

  const removeResultToken = useCallback((slug: string) => {
    setState((prev) => {
      const next = { ...prev.resultTokens };
      delete next[slug];
      return { ...prev, resultTokens: next };
    });
  }, []);

  return { ...state, setMunicipalityId, addResultToken, removeResultToken };
}

export { useStoredQuiz };
