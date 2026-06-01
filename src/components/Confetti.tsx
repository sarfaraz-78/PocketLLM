import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

interface Piece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  speed: number;
}

const ConfettiBase: React.FC<ConfettiProps> = ({
  active,
  count = 60,
  duration = 2200,
  onComplete,
}) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const palette = useMemo(
    () => [
      colors.primary,
      colors.secondary || '#8B5CF6',
      colors.accent || '#EC4899',
      colors.success,
      colors.warning,
    ],
    [colors]
  );

  const pieces = useRef<Piece[]>([]);
  if (pieces.current.length === 0 && active) {
    pieces.current = Array.from({ length: count }).map(() => {
      const startX = Math.random() * screenWidth;
      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(-50),
        rotation: new Animated.Value(0),
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 6 + Math.random() * 8,
        speed: 0.7 + Math.random() * 0.6,
      };
    });
  }

  useEffect(() => {
    if (!active || pieces.current.length === 0) return;

    const animations = pieces.current.map((p) => {
      const endY = Dimensions.get('window').height + 50;
      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: endY * p.speed,
          duration: duration * p.speed,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.rotation, {
          toValue: 360 * 4 * p.speed,
          duration: duration * p.speed,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(8, animations).start(() => {
      pieces.current = [];
      onComplete?.();
    });
  }, [active]);

  if (!active || pieces.current.length === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.current.map((p, i) => {
        const spin = p.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: 2,
              transform: [{ translateY: p.y }, { rotate: spin }],
            }}
          />
        );
      })}
    </View>
  );
};

export const Confetti = React.memo(ConfettiBase);
