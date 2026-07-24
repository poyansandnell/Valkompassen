import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type ViewStyle, type StyleProp } from 'react-native';

/**
 * Diskret intoning: tonar in innehållet och glider upp det några pixlar.
 */
export function FadeInUp({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Räknar mjukt upp ett procenttal från 0 till målvärdet.
 * Returnerar bara siffran som text – styling sätts av föräldern.
 */
export function useCountUp(target: number, duration = 900, delay = 150): number {
  const [value, setValue] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setValue(Math.round(v)));
    Animated.timing(anim, {
      toValue: target,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setValue(target));
    return () => anim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}
