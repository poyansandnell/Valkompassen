import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getGetQuizQueryKey, useGetQuiz } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAnswers } from '@/context/AnswersContext';
import { Card, PrimaryButton, ProgressBar } from '@/components/ui';
import {
  LEVELS,
  SCALE_OPTIONS,
  WEIGHT_NORMAL,
  WEIGHT_OPTIONS,
  answerKey,
  type Level,
} from '@/lib/quiz';

export default function QuizScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { level, municipalityId, municipalityName } = useLocalSearchParams<{
    level: Level;
    municipalityId?: string;
    municipalityName?: string;
  }>();

  const key = answerKey(level, municipalityId ?? null);
  const { hydrated, getLevel, setAnswer, setLevelMeta } = useAnswers();
  const levelState = getLevel(key);

  const quizQuery = useGetQuiz(
    level,
    municipalityId ? { municipalityId } : undefined,
    {
      query: {
        queryKey: getGetQuizQueryKey(level, municipalityId ? { municipalityId } : undefined),
        staleTime: 5 * 60 * 1000,
      },
    },
  );
  const quiz = quizQuery.data;

  const [index, setIndex] = useState<number>(-1); // -1 = not initialized

  // Initialize to first unanswered question once quiz + storage are ready
  useEffect(() => {
    if (!quiz || !hydrated || index >= 0) return;
    const firstUnanswered = quiz.questions.findIndex(
      (q) => levelState.answers[q.id] === undefined,
    );
    setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
    setLevelMeta(key, {
      totalQuestions: quiz.questions.length,
      municipalityId: municipalityId ?? null,
      municipalityName: municipalityName ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, hydrated]);

  const question = quiz && index >= 0 ? quiz.questions[index] : undefined;
  const existing = question ? levelState.answers[question.id] : undefined;
  const [weight, setWeight] = useState<number>(WEIGHT_NORMAL);

  // Sync weight state when the visible question changes (explicit key change, not prop sync)
  const questionId = question?.id;
  useEffect(() => {
    if (!questionId) return;
    const saved = levelState.answers[questionId];
    setWeight(saved ? saved.weight : WEIGHT_NORMAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const total = quiz?.questions.length ?? 0;
  const progress = useMemo(() => (total > 0 && index >= 0 ? index / total : 0), [index, total]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const goNext = () => {
    if (!quiz) return;
    if (index + 1 >= quiz.questions.length) {
      router.replace({
        pathname: '/results/[level]',
        params: {
          level,
          ...(municipalityId ? { municipalityId } : {}),
          ...(municipalityName ? { municipalityName } : {}),
        },
      });
    } else {
      setIndex(index + 1);
    }
  };

  const selectValue = (value: number | null) => {
    if (!question) return;
    Haptics.selectionAsync().catch(() => {});
    setAnswer(key, question.id, { value, weight });
    goNext();
  };

  // Route guard: region/kommun require a municipality — redirect to selection.
  const needsMunicipality = LEVELS.find((l) => l.level === level)?.needsMunicipality;
  useEffect(() => {
    if (needsMunicipality && !municipalityId) {
      router.replace({ pathname: '/level/[level]', params: { level } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsMunicipality, municipalityId]);
  if (needsMunicipality && !municipalityId) return null;

  if (quizQuery.isLoading || !hydrated || (quiz && index < 0)) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (quizQuery.isError || !quiz) {
    return (
      <View style={[styles.center, { backgroundColor: c.background, paddingHorizontal: 24 }]}>
        <Feather name="alert-circle" size={28} color={c.mutedForeground} />
        <Text style={{ color: c.foreground, fontFamily: 'Inter_500Medium', marginTop: 12 }}>
          Kunde inte hämta frågorna.
        </Text>
        <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
          <PrimaryButton label="Försök igen" onPress={() => quizQuery.refetch()} />
        </View>
      </View>
    );
  }

  if (!question) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topInset }}>
      <View style={styles.topBar}>
        <Pressable
          testID="quiz-back"
          onPress={() => (index > 0 ? setIndex(index - 1) : router.back())}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.counter, { color: c.mutedForeground }]}>
          {index + 1} / {total}
        </Text>
        <Pressable
          testID="quiz-close"
          onPress={() => router.dismissTo('/')}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="x" size={22} color={c.foreground} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <ProgressBar progress={progress} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 24 }}
      >
        <Text style={[styles.category, { color: c.accentForeground }]}>
          {question.category}
        </Text>
        <Text style={[styles.questionText, { color: c.foreground }]}>{question.text}</Text>
        {question.explanation ? (
          <Text style={[styles.explanation, { color: c.mutedForeground }]}>
            {question.explanation}
          </Text>
        ) : null}

        <Text style={[styles.weightLabel, { color: c.mutedForeground }]}>
          Hur viktig är frågan för dig?
        </Text>
        <View style={styles.weightRow}>
          {WEIGHT_OPTIONS.map((opt) => {
            const active = weight === opt.value;
            return (
              <Pressable
                key={opt.value}
                testID={`weight-${opt.value}`}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setWeight(opt.value);
                }}
                style={({ pressed }) => [
                  styles.weightChip,
                  {
                    backgroundColor: active ? c.accent : c.card,
                    borderColor: active ? c.accentForeground : c.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? c.accentForeground : c.mutedForeground,
                    fontSize: 13,
                    fontFamily: 'Inter_500Medium',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 10, marginTop: 20 }}>
          {SCALE_OPTIONS.map((opt) => {
            const selected = existing?.value === opt.value;
            return (
              <Pressable
                key={opt.value}
                testID={`answer-${opt.value}`}
                onPress={() => selectValue(opt.value)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected ? c.primary : c.card,
                    borderColor: selected ? c.primary : c.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? c.primaryForeground : c.foreground,
                    fontSize: 15,
                    fontFamily: 'Inter_500Medium',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          testID="skip-question"
          onPress={() => selectValue(null)}
          style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={{ color: c.mutedForeground, fontSize: 14, fontFamily: 'Inter_500Medium' }}>
            Hoppa över frågan
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { padding: 8 },
  counter: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  category: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
  },
  questionText: { fontSize: 21, fontFamily: 'Inter_700Bold', lineHeight: 29, marginTop: 8 },
  explanation: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginTop: 10 },
  weightLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 20 },
  weightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  weightChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  skip: { alignSelf: 'center', padding: 12, marginTop: 12 },
});
