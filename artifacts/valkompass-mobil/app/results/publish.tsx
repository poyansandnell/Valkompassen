import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getGetQuizQueryKey,
  useCreateResultPage,
  useGetQuiz,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAnswers } from '@/context/AnswersContext';
import { Card, PrimaryButton } from '@/components/ui';
import { answerKey, computeMatches, type Level } from '@/lib/quiz';

/** Kanonisk publik adress — samma som webben delar. */
const PUBLIC_ORIGIN = 'https://valkompassen.org';

/** Sparade nycklar till publicerade sidor (för ev. framtida radering). */
const TOKENS_KEY = 'result-page-tokens-v1';

async function saveTokens(slug: string, editToken: string, deleteToken: string) {
  try {
    const raw = await AsyncStorage.getItem(TOKENS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    map[slug] = { editToken, deleteToken };
    await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(map));
  } catch {
    // Sparande av nycklar är bekvämlighet — får inte stoppa publiceringen.
  }
}

export default function PublishResultScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { level, municipalityId, municipalityName } = useLocalSearchParams<{
    level: Level;
    municipalityId?: string;
    municipalityName?: string;
  }>();

  const key = answerKey(level, municipalityId ?? null);
  const { getLevel } = useAnswers();
  const levelState = getLevel(key);

  const quizQuery = useGetQuiz(level, municipalityId ? { municipalityId } : undefined, {
    query: {
      queryKey: getGetQuizQueryKey(level, municipalityId ? { municipalityId } : undefined),
      staleTime: 5 * 60 * 1000,
    },
  });
  const quiz = quizQuery.data;

  const matches = useMemo(
    () => (quiz ? computeMatches(quiz, levelState.answers).filter((m) => m.isQualified) : []),
    [quiz, levelState.answers],
  );

  const [displayName, setDisplayName] = useState('');
  const [comment, setComment] = useState('');
  const [showBestParty, setShowBestParty] = useState(true);
  const [showFullList, setShowFullList] = useState(false);
  const [isIndexable, setIsIndexable] = useState(false);
  const [confirmPublic, setConfirmPublic] = useState(false);

  const createPage = useCreateResultPage();
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const publicUrl = publishedSlug ? `${PUBLIC_ORIGIN}/resultat/${publishedSlug}` : null;

  const handlePublish = () => {
    if (!quiz || !confirmPublic || createPage.isPending) return;
    createPage.mutate(
      {
        data: {
          level,
          areaName: quiz.areaName,
          displayName: displayName.trim() || null,
          locality: municipalityName ?? null,
          comment: comment.trim() || null,
          showBestParty,
          showFullList,
          showTopics: false,
          isIndexable,
          confirmPublic: true,
          topMatches: matches.slice(0, showFullList ? matches.length : 3).map((m) => ({
            partyName: m.name,
            partyAbbreviation: m.abbreviation,
            partySlug: m.slug,
            partyColor: m.color,
            matchPercent: m.matchPercent,
            basedOnQuestions: m.basedOnQuestions,
            totalQuestions: m.totalQuestions,
          })),
        },
      },
      {
        onSuccess: (data) => {
          setPublishedSlug(data.publicSlug);
          saveTokens(data.publicSlug, data.editToken, data.deleteToken);
        },
      },
    );
  };

  const handleShare = async () => {
    if (!publicUrl) return;
    const message = `Jag har gjort Valkompassen inför valet 2026 – här är mitt resultat: ${publicUrl}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: 'Valkompassen', text: message, url: publicUrl });
        } else {
          await navigator.clipboard.writeText(publicUrl);
          setShareFeedback('Länk kopierad!');
          setTimeout(() => setShareFeedback(null), 2000);
        }
      } else {
        await Share.share(
          Platform.OS === 'ios' ? { message, url: publicUrl } : { message },
        );
      }
    } catch {
      // Användaren stängde delningsmenyn — inget fel.
    }
  };

  if (quizQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topInset }}>
      <View style={styles.topBar}>
        <Pressable
          testID="publish-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={20} color={c.foreground} />
          <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_500Medium' }}>
            Tillbaka
          </Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: c.foreground }]}>
          {publishedSlug ? 'Publicerat!' : 'Publicera resultat'}
        </Text>
        <View style={{ width: 84 }} />
      </View>

      {publishedSlug ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 24 }}
        >
          <Card>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Feather name="check-circle" size={40} color={c.primary} />
              <Text style={[styles.successTitle, { color: c.foreground }]}>
                Din resultatsida är live
              </Text>
              <Text selectable style={[styles.urlText, { color: c.primary }]}>
                {publicUrl}
              </Text>
              <Text style={[styles.help, { color: c.mutedForeground, textAlign: 'center' }]}>
                {isIndexable
                  ? 'Du har valt att sidan får hittas av Google och andra sökmotorer.'
                  : 'Sidan syns bara för den som har länken — den indexeras inte av Google.'}
              </Text>
            </View>
          </Card>
          <View style={{ marginTop: 16, gap: 10 }}>
            <PrimaryButton
              testID="publish-share"
              label={shareFeedback ?? 'Dela länken'}
              onPress={handleShare}
            />
            <PrimaryButton
              variant="secondary"
              label="Klart"
              onPress={() => router.back()}
            />
          </View>
          <Text style={[styles.help, { color: c.mutedForeground, marginTop: 16 }]}>
            Tips för Instagram: dela länken och klistra in i din story eller bio. Du kan
            när som helst radera sidan genom att öppna länken på den här enheten.
          </Text>
        </ScrollView>
      ) : (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          bottomOffset={24}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 24, gap: 14 }}
        >
          <Text style={[styles.help, { color: c.mutedForeground }]}>
            Skapa en egen offentlig sida med ditt resultat på valkompassen.org som du kan
            dela på Facebook, Instagram med mera. Du bestämmer själv vad som visas.
          </Text>

          <Card>
            <Text style={[styles.label, { color: c.foreground }]}>Namn (valfritt)</Text>
            <TextInput
              testID="publish-name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="T.ex. Anna"
              placeholderTextColor={c.mutedForeground}
              maxLength={60}
              style={[styles.input, { color: c.foreground, borderColor: c.border }]}
            />
            <Text style={[styles.label, { color: c.foreground, marginTop: 14 }]}>
              Kommentar (valfritt)
            </Text>
            <TextInput
              testID="publish-comment"
              value={comment}
              onChangeText={setComment}
              placeholder="Skriv något om ditt resultat…"
              placeholderTextColor={c.mutedForeground}
              maxLength={280}
              multiline
              style={[
                styles.input,
                { color: c.foreground, borderColor: c.border, minHeight: 72, textAlignVertical: 'top' },
              ]}
            />
          </Card>

          <Card>
            <ToggleRow
              testID="toggle-best"
              label="Visa bästa matchning"
              help="Parti och procent för din toppmatchning."
              value={showBestParty}
              onChange={setShowBestParty}
            />
            <ToggleRow
              testID="toggle-list"
              label="Visa hela listan"
              help="Alla partiers matchprocent, inte bara topp 3."
              value={showFullList}
              onChange={setShowFullList}
            />
            <ToggleRow
              testID="toggle-index"
              label="Tillåt sökmotorer"
              help="Låt Google och andra sökmotorer hitta sidan. Av som standard."
              value={isIndexable}
              onChange={setIsIndexable}
              last
            />
          </Card>

          <Card>
            <ToggleRow
              testID="toggle-confirm"
              label="Jag förstår att sidan blir offentlig"
              help="Alla som har länken kan se det du valt att visa."
              value={confirmPublic}
              onChange={setConfirmPublic}
              last
            />
          </Card>

          {createPage.isError && (
            <Text style={{ color: c.destructive, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
              Det gick inte att publicera just nu. Kontrollera din uppkoppling och försök igen.
            </Text>
          )}

          <PrimaryButton
            testID="publish-submit"
            label="Publicera sidan"
            onPress={handlePublish}
            disabled={!confirmPublic || !quiz || matches.length === 0}
            loading={createPage.isPending}
          />
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

function ToggleRow({
  label,
  help,
  value,
  onChange,
  last,
  testID,
}: {
  label: string;
  help: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
  testID?: string;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.toggleRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_500Medium' }}>
          {label}
        </Text>
        <Text style={[styles.help, { color: c.mutedForeground, marginTop: 2 }]}>{help}</Text>
      </View>
      <Switch testID={testID} value={value} onValueChange={onChange} trackColor={{ true: c.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 84 },
  topTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  help: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  successTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  urlText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});
