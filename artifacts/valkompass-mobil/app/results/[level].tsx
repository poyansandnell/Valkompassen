import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { FadeInUp, useCountUp } from '@/components/ResultReveal';
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
  const { hydrated, getLevel, clearLevelAll, setLevelMeta } = useAnswers();
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
  const [expandedParty, setExpandedParty] = useState<string | null>(null);

  const matches = useMemo(
    () => (quiz ? computeMatches(quiz, levelState.answers) : []),
    [quiz, levelState.answers],
  );
  const qualifiedMatches = matches.filter((m) => m.isQualified);
  const nonQualified = matches.filter((m) => !m.isQualified);
  const visibleMatches = onlyInAssembly
    ? qualifiedMatches.filter((m) => m.inAssembly)
    : qualifiedMatches;
  const visibleNonQualified = onlyInAssembly
    ? nonQualified.filter((m) => m.inAssembly)
    : nonQualified;
  const hiddenCount =
    qualifiedMatches.length - visibleMatches.length +
    (nonQualified.length - visibleNonQualified.length);
  const answered = answeredCount(levelState.answers);
  const hasTestData = matches.some((m) => m.isTestData);
  const topMatch = visibleMatches[0];
  const runnersUp = visibleMatches.slice(1);
  // Den övergripande vinnaren (utan filter) — det är den som sparas för startsidan.
  const overallTop = qualifiedMatches[0];

  // Diskret intoning + procenträknare på toppmatchningen.
  const animatedPercent = useCountUp(topMatch?.matchPercent ?? 0);

  // Spara toppmatchningen så startsidan kan visa den.
  useEffect(() => {
    if (!overallTop || !hydrated) return;
    const stored = levelState.topMatch;
    if (
      stored?.partyId === overallTop.partyId &&
      stored?.matchPercent === overallTop.matchPercent
    )
      return;
    setLevelMeta(key, {
      topMatch: {
        partyId: overallTop.partyId,
        name: overallTop.name,
        abbreviation: overallTop.abbreviation,
        color: overallTop.color,
        matchPercent: overallTop.matchPercent,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overallTop?.partyId, overallTop?.matchPercent, hydrated]);

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
          <Feather name="arrow-left" size={20} color={c.foreground} />
          <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_500Medium' }}>
            Hem
          </Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: c.foreground }]}>Ditt resultat</Text>
        <View style={{ width: 64 }} />
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
            rekommendation om hur du ska rösta. Partiernas svar är redaktionellt bedömda
            utifrån deras officiella program; där en lokal förening saknar publicerade
            lokala ståndpunkter utgår bedömningen från partiets rikspolitik.
          </Text>
        </Card>

        {quiz.hasAssemblyData !== false && (
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
        )}
        {onlyInAssembly && hiddenCount > 0 && (
          <Text style={[styles.hiddenNote, { color: c.mutedForeground }]}>
            {hiddenCount} partier döljs av filtret.
          </Text>
        )}

        {topMatch && (
          <FadeInUp
            style={[
              styles.heroCard,
              {
                backgroundColor: c.card,
                borderColor: topMatch.color || c.primary,
              },
            ]}
          >
            <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' }}>
              Bäst matchning
            </Text>
            <View style={[styles.matchRow, { marginTop: 10 }]}>
              <View style={[styles.heroDot, { backgroundColor: topMatch.color || c.primary }]}>
                <Text style={[styles.partyAbbr, { fontSize: 15 }]}>{topMatch.abbreviation}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.foreground, fontSize: 19, fontFamily: 'Inter_700Bold' }}>
                  {topMatch.name}
                </Text>
                <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
                  Baserat på {topMatch.basedOnQuestions} av {topMatch.totalQuestions} frågor
                </Text>
              </View>
              <Text style={{ color: topMatch.color || c.foreground, fontSize: 28, fontFamily: 'Inter_700Bold' }}>
                {animatedPercent}%
              </Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <ProgressBar
                progress={topMatch.matchPercent / 100}
                color={topMatch.color || c.primary}
                height={8}
              />
            </View>
            {topMatch.description ? (
              <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginTop: 12 }}>
                {topMatch.description}
              </Text>
            ) : null}
            {topMatch.website ? (
              <Pressable
                testID="top-match-website"
                onPress={() => Linking.openURL(topMatch.website!)}
                style={({ pressed }) => [styles.websiteRow, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="external-link" size={14} color={c.primary} />
                <Text style={{ color: c.primary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                  Besök partiets webbplats
                </Text>
              </Pressable>
            ) : null}
          </FadeInUp>
        )}

        <View style={{ gap: 12, marginTop: 16 }}>
          {runnersUp.map((m) => {
            const expanded = expandedParty === m.partyId;
            return (
              <Pressable
                key={m.partyId}
                testID={`party-row-${m.partyId}`}
                onPress={() => setExpandedParty(expanded ? null : m.partyId)}
              >
                <Card
                  style={
                    expanded
                      ? { borderWidth: 2, borderColor: m.color || c.primary }
                      : undefined
                  }
                >
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
                    </View>
                    <Text style={{ color: c.foreground, fontSize: 18, fontFamily: 'Inter_700Bold' }}>
                      {m.matchPercent}%
                    </Text>
                    <Feather
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={c.mutedForeground}
                    />
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <ProgressBar progress={m.matchPercent / 100} color={m.color || c.primary} height={6} />
                  </View>
                  {expanded && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                        Baserat på {m.basedOnQuestions} av {m.totalQuestions} frågor
                      </Text>
                      {m.description ? (
                        <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginTop: 8 }}>
                          {m.description}
                        </Text>
                      ) : null}
                      {m.website ? (
                        <Pressable
                          onPress={() => Linking.openURL(m.website!)}
                          style={({ pressed }) => [styles.websiteRow, { opacity: pressed ? 0.6 : 1 }]}
                        >
                          <Feather name="external-link" size={14} color={c.primary} />
                          <Text style={{ color: c.primary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                            Besök partiets webbplats
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>

        {visibleNonQualified.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
              Övriga partier som ställer upp
            </Text>
            <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 }}>
              Dessa partier har inte tillräckligt många bedömda svar för att få en rättvis
              matchningspoäng ({'\u2265'}50% av frågorna krävs).
            </Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {visibleNonQualified.map((m) => {
                const expanded = expandedParty === m.partyId;
                return (
                  <Pressable
                    key={m.partyId}
                    testID={`party-row-${m.partyId}`}
                    onPress={() => setExpandedParty(expanded ? null : m.partyId)}
                  >
                    <Card
                      style={
                        expanded
                          ? { borderWidth: 2, borderColor: m.color || c.mutedForeground }
                          : undefined
                      }
                    >
                      <View style={styles.matchRow}>
                        <View style={[styles.partyDot, { backgroundColor: m.color || c.mutedForeground }]}>
                          <Text style={styles.partyAbbr}>{m.abbreviation}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>
                            {m.name}
                          </Text>
                          <Text style={{ color: c.mutedForeground, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                            {m.basedOnQuestions === 0
                              ? 'Har inte lämnat svar'
                              : `Ofullständigt underlag (${m.basedOnQuestions} av ${m.totalQuestions} frågor)`}
                          </Text>
                        </View>
                        <Feather
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={c.mutedForeground}
                        />
                      </View>
                      {expanded && (
                        <View style={{ marginTop: 12 }}>
                          {m.description ? (
                            <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 }}>
                              {m.description}
                            </Text>
                          ) : (
                            <Text style={{ color: c.mutedForeground, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
                              Ingen mer information finns om det här partiet ännu.
                            </Text>
                          )}
                          {m.website ? (
                            <Pressable
                              onPress={() => Linking.openURL(m.website!)}
                              style={({ pressed }) => [styles.websiteRow, { opacity: pressed ? 0.6 : 1 }]}
                            >
                              <Feather name="external-link" size={14} color={c.primary} />
                              <Text style={{ color: c.primary, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
                                Besök partiets webbplats
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ marginTop: 24, gap: 10 }}>
          <PrimaryButton
            testID="redo-quiz"
            label="Gör om"
            variant="secondary"
            onPress={() => {
              // Rensa hela nivån (även tidigare vald kommun/region) så att
              // startsidan inte faller tillbaka på ett gammalt resultat.
              clearLevelAll(level);
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
  backBtn: { padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  heroCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  heroDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
});
