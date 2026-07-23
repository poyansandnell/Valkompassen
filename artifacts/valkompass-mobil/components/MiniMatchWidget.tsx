import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { PartyMatch } from '@/lib/quiz';

/**
 * Live mini match bars shown while answering (same idea as the web app):
 * small vertical bars per party that grow as answers come in.
 * Tap to expand a list with abbreviations and horizontal bars.
 */
export function MiniMatchWidget({ matches }: { matches: PartyMatch[] }) {
  const c = useColors();
  const [expanded, setExpanded] = useState<boolean>(false);

  if (matches.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        testID="mini-match-widget"
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [
          styles.barsBox,
          { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {matches.map((m) => (
          <View
            key={m.partyId}
            style={{
              width: 5,
              borderRadius: 3,
              height: Math.max(4, (m.matchPercent / 100) * 20),
              backgroundColor: m.color || c.primary,
            }}
          />
        ))}
      </Pressable>

      {expanded && (
        <View style={[styles.popover, { backgroundColor: c.card, borderColor: c.border }]}>
          {matches.map((m) => (
            <View key={m.partyId} style={styles.row}>
              <Text style={[styles.abbr, { color: c.foreground }]}>{m.abbreviation}</Text>
              <View style={[styles.track, { backgroundColor: c.secondary }]}>
                <View
                  style={{
                    width: `${m.matchPercent}%`,
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: m.color || c.primary,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 10 },
  barsBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    height: 34,
  },
  popover: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 150,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
    gap: 7,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  abbr: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    width: 26,
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
});
