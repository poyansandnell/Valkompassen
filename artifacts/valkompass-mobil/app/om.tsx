import React from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/ui';

const NOT_AFFILIATED: string[] = [
  'Valmyndigheten',
  'Sveriges riksdag',
  'Någon kommun',
  'Någon region',
  'Någon annan svensk myndighet',
];

const OFFICIAL_SOURCES: { label: string; url: string }[] = [
  { label: 'Valmyndigheten – val.se', url: 'https://www.val.se' },
  { label: 'Sveriges riksdag – riksdagen.se', url: 'https://www.riksdagen.se' },
  { label: 'Sveriges Kommuner och Regioner – skr.se', url: 'https://skr.se' },
];

export default function AboutScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const bodyStyle = {
    color: c.mutedForeground,
    fontSize: 14,
    fontFamily: 'Inter_400Regular' as const,
    lineHeight: 21,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topInset }}>
      <View style={styles.topBar}>
        <Pressable
          testID="about-back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.foreground }]}>Om Valkompass</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 24, gap: 12 }}
      >
        <Card>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: c.accent }]}>
              <Feather name="flag" size={16} color={c.accentForeground} />
            </View>
            <Text style={[styles.cardTitle, { color: c.foreground }]}>
              En oberoende app
            </Text>
          </View>
          <Text style={[bodyStyle, { marginTop: 8 }]}>
            Valkompass är en oberoende app. Den är enbart ett fristående hjälpmedel för att
            jämföra politiska ståndpunkter inför valen 2026 — aldrig en röstningsrekommendation.
          </Text>
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: c.accent }]}>
              <Feather name="alert-circle" size={16} color={c.accentForeground} />
            </View>
            <Text style={[styles.cardTitle, { color: c.foreground }]}>
              Ansvarsfriskrivning
            </Text>
          </View>
          <Text style={[bodyStyle, { marginTop: 8 }]}>
            Valkompass är INTE kopplad till, godkänd av eller representerar:
          </Text>
          {NOT_AFFILIATED.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Text style={[bodyStyle, { color: c.foreground }]}>•</Text>
              <Text style={[bodyStyle, { flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: c.accent }]}>
              <Feather name="external-link" size={16} color={c.accentForeground} />
            </View>
            <Text style={[styles.cardTitle, { color: c.foreground }]}>
              Officiella källor
            </Text>
          </View>
          <Text style={[bodyStyle, { marginTop: 8 }]}>
            För officiell information om valen, rösträtt och röstning hänvisar vi till
            myndigheternas egna webbplatser:
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
