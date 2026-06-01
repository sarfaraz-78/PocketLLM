import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS } from '../../theme/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonBase: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.sm,
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceElevated,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const Skeleton = React.memo(SkeletonBase);
