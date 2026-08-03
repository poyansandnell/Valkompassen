import React from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/ui';

const SECTIONS: { icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  {
    icon: 'list',
    title: 'Ta ställning',
    body: 'Du får ta ställning till ett antal politiska förslag på en femgradig skala. Frågor som är extra viktiga för dig kan du markera med en stjärna – de väger då tyngre i resultatet.',
  },
  {
    icon: 'percent',
    title: 'Matchningen',
    body: 'Vi jämför dina svar med partiernas svar, fråga för fråga. Resultatet visar din sakpolitiska matchning i procent. Frågor du hoppar över räknas inte med. Resultatet är aldrig en rekommendation om hur du ska rösta.',
  },
  {
    icon: 'shield',
    title: 'Integritet',
    body: 'Inget konto behövs. Dina svar sparas endast på din enhet och skickas aldrig till någon server i identifierbar form.',
  },
  {
    icon: 'flag',
    title: 'Oberoende',
    body: 'Valkompass är en oberoende tjänst som inte ägs eller styrs av något politiskt parti, Valmyndigheten eller någon mediekoncern. Alla partier behandlas lika.',
  },
  {
    icon: 'alert-circle',
    title: 'Ansvarsfriskrivning',
    body: 'Valkompass är en oberoende app och är inte kopplad till, godkänd av eller representerar svenska staten, Valmyndigheten, någon kommun, region eller annan myndighet. Appen är enbart ett fristående hjälpmedel för att jämföra politiska ståndpunkter — aldrig en röstningsrekommendation.',
  },
];

const OFFICIAL_SOURCES: { label: string; url: string }[] = [
  { label: 'Valmyndigheten – val.se', url: 'https://www.val.se' },
  { label: 'Sveriges riksdag – riksdagen.se', url: 'https://www.riksdagen.se' },
  { label: 'Sveriges Kommuner och Regioner – skr.se', url: 'https://skr.se' },
];

export default function InfoScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topInset }}>
      <View style={styles.topBar}>
        <Pressable
          testID="info-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.foreground }]}>Så fungerar det</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 24, gap: 12 }}
      >
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: c.accent }]}>
                <Feather name={s.icon} size={16} color={c.accentForeground} />
              </View>
              <Text style={{ color: c.foreground, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
                {s.title}
              </Text>
            </View>
            <Text
              style={{
                color: c.mutedForeground,
                fontSize: 14,
                fontFamily: 'Inter_400Regular',
                lineHeight: 21,
                marginTop: 8,
              }}
            >
              {s.body}
            </Text>
          </Card>
        ))}

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconCircle, { backgroundColor: c.accent }]}>
              <Feather name="external-link" size={16} color={c.accentForeground} />
            </View>
            <Text style={{ color: c.foreground, fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
              Officiella källor
            </Text>
          </View>
          <Text
            style={{
              color: c.mutedForeground,
              fontSize: 14,
              fontFamily: 'Inter_400Regular',
              lineHeight: 21,
              marginTop: 8,
            }}
          >
            För officiell information om valen, rösträtt och röstning hänvisar vi till myndigheternas egna webbplatser:
          </Text>
          {OFFICIAL_SOURCES.map((s) => (
            <Pressable
              key={s.url}
              onPress={() => Linking.openURL(s.url)}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginTop: 10 })}
            >
              <Text style={{ color: c.primary, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { padding: 8 },
  topTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
