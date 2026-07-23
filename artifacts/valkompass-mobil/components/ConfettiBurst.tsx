import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const PIECES = 48;

interface Piece {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  round: boolean;
}

/**
 * Lätt konfetti-regn utan externa beroenden. Ritas en gång (t.ex. när
 * resultatet visas första gången) och plockar bort sig själv efteråt.
 */
export function ConfettiBurst({ colors, onDone }: { colors: string[]; onDone?: () => void }) {
  const { width, height } = Dimensions.get('window');
  const progress = useRef(new Animated.Value(0)).current;

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        x: ((i * 83) % 100) / 100 * width,
        size: 6 + ((i * 37) % 7),
        color: colors[i % colors.length] || '#6d28d9',
        delay: (i * 29) % 400,
        duration: 2200 + ((i * 53) % 900),
        drift: (((i * 61) % 80) - 40),
        spin: ((i * 47) % 2 === 0 ? 1 : -1) * (2 + ((i * 13) % 3)),
        round: (i * 31) % 3 === 0,
      })),
    [colors, width],
  );

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 3200,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(() => onDone?.());
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const localStart = p.delay / 3200;
        const translateY = progress.interpolate({
          inputRange: [0, localStart, 1],
          outputRange: [-30, -30, height + 40],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, p.drift, p.drift * 1.6],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin * 180}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.75, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.round ? p.size : p.size * 1.8,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
