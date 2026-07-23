import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAnswers } from '@/context/AnswersContext';
import { Card, ProgressBar } from '@/components/ui';
import { LEVELS, answerKey, answeredCount, type Level } from '@/lib/quiz';

const LEVEL_ICONS: Record<Level, keyof typeof Feather.glyphMap> = {
  riksdag: 'home',
  region: 'map',
  kommun: 'map-pin',
};

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data } = useAnswers();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{
        paddingTop: topInset + 24,
        paddingBottom: bottomInset + 32,
        paddingHorizontal: 20,
      }}
    >
      <View style={styles.header}>
        <View style={[styles.logoBox, { backgroundColor: '#6d28d9' }]}>
          <Feather name="flag" size={22} color={c.primaryForeground} />
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>Valkompass</Text>
      </View>
      <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
        Jämför dina åsikter med partiernas inför valet – för riksdag, region och kommun.
        Oberoende. Inget konto behövs.
      </Text>

      <View style={{ gap: 14, marginTop: 24 }}>
        {LEVELS.map((meta) => {
          // Find any started state for this level (any municipality)
          const startedKey = Object.keys(data).find(
            (k) => k.startsWith(`${meta.level}:`) && answeredCount(data[k].answers) > 0,
          );
          const state = startedKey ? data[startedKey] : undefined;
          const answered = state ? answeredCount(state.answers) : 0;
          const total = state?.totalQuestions ?? 0;
          const done = answered > 0 && total > 0 && answered >= total;
          const topMatch = done ? state?.topMatch : undefined;

          const resultsParams = {
            pathname: '/results/[level]' as const,
            params: {
              level: meta.level,
              ...(state?.municipalityId ? { municipalityId: state.municipalityId } : {}),
              ...(state?.municipalityName ? { municipalityName: state.municipalityName } : {}),
            },
          };

          return (
            <Pressable
              key={meta.level}
              testID={`level-card-${meta.level}`}
              onPress={() =>
                done ? router.push(resultsParams) : router.push(`/level/${meta.level}`)
              }
            >
              {({ pressed }) => (
                <Card
                  style={{
                    opacity: pressed ? 0.85 : 1,
                    ...(topMatch
                      ? { borderWidth: 2, borderColor: topMatch.color || c.primary }
                      : {}),
                  }}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.iconCircle, { backgroundColor: c.accent }]}>
                      <Feather name={LEVEL_ICONS[meta.level]} size={20} color={c.accentForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: c.foreground }]}>{meta.title}</Text>
                      <Text style={[styles.cardDesc, { color: c.mutedForeground }]}>
                        {meta.description}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={22} color={c.mutedForeground} />
                  </View>
                  {done ? (
                    <Pressable
                      testID={`show-results-${meta.level}`}
                      onPress={() => router.push(resultsParams)}
                      style={({ pressed }) => [
                        styles.doneRow,
                        {
                          backgroundColor: topMatch
                            ? `${topMatch.color}1A`
                            : c.accent,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      {topMatch ? (
                        <>
                          <View
                            style={[styles.miniDot, { backgroundColor: topMatch.color || c.primary }]}
                          >
                            <Text style={styles.miniAbbr}>{topMatch.abbreviation}</Text>
                          </View>
                          <Text style={[styles.doneText, { color: c.foreground }]}>
                            Bäst matchning: {topMatch.name} · {topMatch.matchPercent}%
                            {state?.municipalityName ? ` · ${state.municipalityName}` : ''}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Feather name="check-circle" size={16} color={c.success} />
                          <Text style={[styles.doneText, { color: c.accentForeground }]}>
                            Klart{state?.municipalityName ? ` · ${state.municipalityName}` : ''} —
                            Visa ditt resultat
                          </Text>
                        </>
                      )}
                      <Feather name="arrow-right" size={16} color={topMatch ? c.foreground : c.accentForeground} />
                    </Pressable>
                  ) : answered > 0 && total > 0 ? (
                    <View style={{ marginTop: 12, gap: 6 }}>
                      <ProgressBar progress={answered / total} />
                      <Text style={[styles.progressText, { color: c.mutedForeground }]}>
                        {answered} av {total} frågor besvarade
                      </Text>
                    </View>
                  ) : null}
                </Card>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        testID="info-link"
        onPress={() => router.push('/info')}
        style={({ pressed }) => [styles.infoLink, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Feather name="info" size={16} color={c.mutedForeground} />
        <Text style={[styles.infoLinkText, { color: c.mutedForeground }]}>Så fungerar det</Text>
      </Pressable>

      <Text style={[styles.privacyNote, { color: c.mutedForeground }]}>
        Dina svar stannar på din enhet.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 12, lineHeight: 22 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 18 },
  progressText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  doneText: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  miniDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAbbr: { color: '#ffffff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    marginTop: 28,
    padding: 8,
  },
  infoLinkText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  privacyNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
