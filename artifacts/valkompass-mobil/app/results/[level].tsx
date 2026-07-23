import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getGetQuizQueryKey,
  useGetQuiz,
  useRecordCompletion,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAnswers } from '@/context/AnswersContext';
import { Badge, Card, PrimaryButton, ProgressBar } from '@/components/ui';
import { LEVELS, answerKey, answeredCount, computeMatches, type Level } from '@/lib/quiz';

export default function ResultsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { level, municipalityId, municipalityName } = useLocalSearchParams<{
    level: Level;
    municipalityId?: string;
    municipalityName?: string;
  }>();
  const meta = LEVELS.find((l) => l.level === level);

  const key = answerKey(level, municipalityId ?? null);
  const { hydrated, getLevel, clearLevel } = useAnswers();
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

  const [onlyInAssembly, setOnlyInAssembly] = useState<boolean>(false);

  const matches = useMemo(
    () => (quiz ? computeMatches(quiz, levelState.answers) : []),
    [quiz, levelState.answers],
  );
  const visibleMatches = onlyInAssembly ? matches.filter((m) => m.inAssembly) : matches;
  const hiddenCount = matches.length - visibleMatches.length;
  const answered = answeredCount(levelState.answers);
  const hasTestData = matches.some((m) => m.isTestData);

  // Record anonymous completion once
  const recordCompletion = useRecordCompletion();
  const recordedRef = useRef<boolean>(false);
  useEffect(() => {
    if (recordedRef.current || !quiz || !hydrated || answered === 0) return;
    recordedRef.current = true;
    recordCompletion.mutate({ data: { level } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, hydrated, answered]);

  // Route guard: region/kommun require a municipality — redirect to selection.
  const needsMunicipality = meta?.needsMunicipality;
  useEffect(() => {
    if (needsMunicipality && !municipalityId) {
      router.replace({ pathname: '/level/[level]', params: { level } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsMunicipality, municipalityId]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (needsMunicipality && !municipalityId) return null;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  if (quizQuery.isLoading || !hydrated) {
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
          Kunde inte hämta resultatet.
        </Text>
        <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
          <PrimaryButton label="Försök igen" onPress={() => quizQuery.refetch()} />
        </View>
      </View>
    );
  }

  const assemblyName =
    level === 'riksdag' ? 'riksdagen' : level === 'region' ? 'regionfullmäktige' : 'kommunfullmäktige';

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topInset }}>
      <View style={styles.topBar}>
        <Pressable
          testID="results-home"
          onPress={() => router.dismissTo('/')}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="x" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.foreground }]}>Ditt resultat</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 24 }}
      >
        <Text style={[styles.areaText, { color: c.mutedForeground }]}>
          {meta?.title}
          {municipalityName ? ` · ${municipalityName}` : ''} · Baserat på {answered} besvarade frågor
        </Text>

        {hasTestData && (
          <View style={{ marginTop: 10 }}>
            <Badge label="TESTDATA – inte partiernas riktiga svar" color={c.destructive} />
          </View>
        )}

        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.neutralNote, { color: c.mutedForeground }]}>
            Listan visar din sakpolitiska matchning med partiernas svar – den är ingen
            rekommendation om hur du ska rösta.
            {!hasTestData &&
              ' Partiernas svar är redaktionellt bedömda utifrån deras officiella program.'}
          </Text>
        </Card>

        <View style={[styles.filterRow, { borderColor: c.border }]}>
          <Text style={{ flex: 1, color: c.foreground, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
            Visa endast partier som redan sitter i {assemblyName}
          </Text>
          <Switch
            testID="assembly-filter"
            value={onlyInAssembly}
            onValueChange={setOnlyInAssembly}
            trackColor={{ true: c.primary }}
          />
        </View>
        {onlyInAssembly && hiddenCount > 0 && (
          <Text style={[styles.hiddenNote, { color: c.mutedForeground }]}>
            {hiddenCount} partier döljs av filtret.
          </Text>
        )}

        <View style={{ gap: 12, marginTop: 16 }}>
          {visibleMatches.map((m, i) => (
            <Card key={m.partyId}>
              <View style={styles.matchRow}>
                <View
                  style={[styles.partyDot, { backgroundColor: m.color || c.primary }]}
                >
                  <Text style={styles.partyAbbr}>{m.abbreviation}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
                    {m.name}
                  </Text>
                  {!m.isQualified && (
                    <Text style={{ color: c.mutedForeground, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                      Ofullständigt underlag ({m.basedOnQuestions} av {m.totalQuestions} frågor)
                    </Text>
                  )}
                </View>
                <Text style={{ color: c.foreground, fontSize: 18, fontFamily: 'Inter_700Bold' }}>
                  {m.matchPercent}%
                </Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <ProgressBar progress={m.matchPercent / 100} color={m.color || c.primary} height={6} />
              </View>
            </Card>
          ))}
        </View>

        <View style={{ marginTop: 24, gap: 10 }}>
          <PrimaryButton
            testID="redo-quiz"
            label="Gör om"
            variant="secondary"
            onPress={() => {
              clearLevel(key);
              router.dismissTo('/');
            }}
          />
        </View>
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
  topTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  areaText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  neutralNote: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  hiddenNote: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partyDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyAbbr: { color: '#ffffff', fontSize: 12, fontFamily: 'Inter_700Bold' },
});
