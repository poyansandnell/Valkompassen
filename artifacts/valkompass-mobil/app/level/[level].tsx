import { errorInfo } from '@/lib/errorInfo';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getListMunicipalitiesQueryKey,
  useListMunicipalities,
  type Municipality,
} from '@workspace/api-client-react';
import { loadCachedMunicipalities, saveCachedMunicipalities } from '@/lib/municipalityCache';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { PrimaryButton, Card } from '@/components/ui';
import { LEVELS, type Level } from '@/lib/quiz';

export default function LevelIntroScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { level } = useLocalSearchParams<{ level: Level }>();
  const meta = LEVELS.find((l) => l.level === level);

  const [search, setSearch] = useState<string>('');

  // Locally cached municipality list: makes the picker open instantly on
  // repeat visits and avoids showing an empty list during the first fetch.
  const [cached, setCached] = useState<Municipality[] | null>(null);
  useEffect(() => {
    loadCachedMunicipalities().then((list) => {
      if (list) setCached(list);
    });
  }, []);

  const municipalitiesQuery = useListMunicipalities({
    query: {
      queryKey: getListMunicipalitiesQueryKey(),
      enabled: !!meta?.needsMunicipality,
      staleTime: 10 * 60 * 1000,
    },
  });

  // Save fresh data to the local cache whenever it arrives.
  useEffect(() => {
    if (municipalitiesQuery.data) saveCachedMunicipalities(municipalitiesQuery.data);
  }, [municipalitiesQuery.data]);

  // Prefer fresh data; fall back to the cache while loading (or on error).
  const municipalities = municipalitiesQuery.data ?? cached;

  // Suggest the user's municipality from device location (native only)
  const [suggested, setSuggested] = useState<{ id: string; name: string; slug: string } | null>(
    null,
  );
  const suggestAttempted = useRef(false);
  useEffect(() => {
    if (Platform.OS === 'web' || !meta?.needsMunicipality) return;
    const list = municipalities;
    if (!list || list.length === 0) return;
    // Run once per screen visit — otherwise the location lookup would rerun
    // when fresh API data replaces the cached list.
    if (suggestAttempted.current) return;
    suggestAttempted.current = true;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        if (cancelled) return;
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (cancelled) return;
        const candidates = places
          .flatMap((p) => [p.city, p.subregion, p.district, p.region])
          .filter((s): s is string => !!s)
          .map((s) => s.toLowerCase());
        const match = list.find((m) =>
          candidates.some((cand) => cand.includes(m.name.toLowerCase())),
        );
        if (match) setSuggested({ id: match.id, name: match.name, slug: match.slug });
      } catch {
        // location unavailable — silently skip the suggestion
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.needsMunicipality, municipalities]);

  const filtered = useMemo(() => {
    const list = municipalities ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) => m.name.toLowerCase().includes(q) || m.regionName.toLowerCase().includes(q),
    );
  }, [municipalities, search]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!meta) return null;

  const startQuiz = (municipalityId?: string, municipalityName?: string) => {
    router.push({
      pathname: '/quiz/[level]',
      params: {
        level: meta.level,
        ...(municipalityId ? { municipalityId } : {}),
        ...(municipalityName ? { municipalityName } : {}),
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: topInset }}>
      <View style={styles.topBar}>
        <Pressable
          testID="back-button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={22} color={c.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.foreground }]}>{meta.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={[styles.desc, { color: c.mutedForeground }]}>{meta.description}</Text>
        <Text style={[styles.desc, { color: c.mutedForeground, marginTop: 6 }]}>
          Du får ta ställning till ett antal politiska förslag. Det tar cirka fem minuter.
        </Text>

        {!meta.needsMunicipality ? (
          <View style={{ marginTop: 28 }}>
            <PrimaryButton testID="start-quiz" label="Starta" onPress={() => startQuiz()} />
          </View>
        ) : (
          <View style={{ flex: 1, marginTop: 20 }}>
            <Text style={[styles.sectionLabel, { color: c.foreground }]}>Välj din kommun</Text>
            {suggested && (
              <Pressable
                testID="suggested-municipality"
                onPress={() => startQuiz(suggested.id, suggested.name)}
                style={({ pressed }) => [
                  styles.suggestRow,
                  { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="navigation" size={16} color={c.accentForeground} />
                <Text style={{ flex: 1, color: c.accentForeground, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                  Nära dig: {suggested.name}
                </Text>
                <Feather name="chevron-right" size={18} color={c.accentForeground} />
              </Pressable>
            )}
            <View
              style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <Feather name="search" size={18} color={c.mutedForeground} />
              <TextInput
                testID="municipality-search"
                style={[styles.searchInput, { color: c.foreground }]}
                placeholder="Sök kommun…"
                placeholderTextColor={c.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>

            {municipalitiesQuery.isLoading && !municipalities ? (
              <View style={{ alignItems: 'center', marginTop: 32, gap: 12 }}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_500Medium' }}>
                  Laddar kommuner…
                </Text>
              </View>
            ) : municipalitiesQuery.isError && !municipalities ? (
              <Card style={{ marginTop: 16 }}>
                <Text style={{ color: c.foreground, fontFamily: 'Inter_500Medium' }}>
                  Kunde inte hämta kommuner.
                </Text>
                {municipalitiesQuery.error ? (
                  <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 8 }}>
                    {errorInfo(municipalitiesQuery.error)}
                  </Text>
                ) : null}
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton
                    label="Försök igen"
                    variant="secondary"
                    onPress={() => municipalitiesQuery.refetch()}
                  />
                </View>
              </Card>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={filtered.length > 0}
                contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', marginTop: 32, gap: 8 }}>
                    <Feather name="map-pin" size={22} color={c.mutedForeground} />
                    <Text style={{ color: c.mutedForeground, fontFamily: 'Inter_400Regular' }}>
                      Ingen kommun matchar sökningen.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <Pressable
                    testID={`municipality-${item.slug}`}
                    onPress={() => startQuiz(item.id, item.name)}
                    style={({ pressed }) => [
                      styles.muniRow,
                      { borderBottomColor: c.border, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.foreground, fontSize: 15, fontFamily: 'Inter_500Medium' }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: c.mutedForeground, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                        {item.regionName}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={c.mutedForeground} />
                  </Pressable>
                )}
              />
            )}
          </View>
        )}
      </View>
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
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  sectionLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', height: '100%' },
  muniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
