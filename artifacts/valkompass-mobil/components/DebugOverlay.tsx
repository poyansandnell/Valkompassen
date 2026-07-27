import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fullLogLines, getApiDomain, subscribeNetLog } from '@/lib/netlog';

/**
 * Floating debug overlay, visible in all builds (including TestFlight).
 * Shows a small "DEBUG" badge; tap it to open a live log of every step:
 * fetch start/end, URL, HTTP status, response info, React Query status,
 * state changes, renders and JS errors.
 */
export function DebugOverlay() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => subscribeNetLog(() => setTick((t) => t + 1)), []);

  const lines = fullLogLines();

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.badge, { top: insets.top + 8 }]}
        hitSlop={8}
      >
        <Text style={styles.badgeText}>DEBUG</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.panel, { top: insets.top + 8, bottom: insets.bottom + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>API: {getApiDomain()}</Text>
        <Pressable onPress={() => setOpen(false)} hitSlop={8}>
          <Text style={styles.close}>Stäng ✕</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        style={{ flex: 1 }}
      >
        {lines.length === 0 ? (
          <Text style={styles.line}>Inga händelser loggade ännu.</Text>
        ) : (
          lines.map((l, i) => (
            <Text key={i} selectable style={styles.line}>
              {l}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 8,
    zIndex: 9999,
    backgroundColor: 'rgba(120,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  panel: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderRadius: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerText: { color: '#8f8', fontSize: 11, flex: 1 },
  close: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 8 },
  line: { color: '#ddd', fontSize: 10, fontFamily: 'Courier', marginBottom: 4 },
});
