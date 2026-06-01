import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const useShimmer = (active: boolean = true, duration: number = 2000) => {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!active) {
      translateX.stopAnimation();
      return;
    }

    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration]);

  return translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });
};
