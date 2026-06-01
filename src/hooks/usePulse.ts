import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const usePulse = (active: boolean = true, duration: number = 1500, minOpacity: number = 0.4) => {
  const opacity = useRef(new Animated.Value(minOpacity)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: minOpacity,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, minOpacity]);

  return opacity;
};
