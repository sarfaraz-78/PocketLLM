import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const useAnimatedRotation = (duration: number = 8000, active: boolean = true) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      rotation.stopAnimation();
      return;
    }

    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [duration, active]);

  return rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};
