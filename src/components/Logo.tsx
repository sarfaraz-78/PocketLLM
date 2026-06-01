import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface LogoProps {
  size?: number;
  breathing?: boolean;
  style?: ViewStyle;
}

/**
 * PocketLLM brand mark.
 * Hexagonal frame + gradient P/L monogram with subtle breathing animation.
 * Pure React Native — no image assets.
 */
export const Logo: React.FC<LogoProps> = ({ size = 96, breathing = true, style }) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!breathing) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.04,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.0,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.9,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1.0,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathing, scale, opacity]);

  // Hexagon math: pointy-top hexagon with side = size
  const hexSide = size;
  const hexWidth = Math.sqrt(3) * hexSide;
  const hexHeight = 2 * hexSide;
  const cornerRadius = size * 0.14;
  const monogramSize = size * 0.55;

  return (
    <Animated.View
      style={[
        {
          width: hexWidth,
          height: hexHeight,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
          opacity,
          shadowColor: colors.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.55,
          shadowRadius: size * 0.28,
          elevation: 12,
        },
        style,
      ]}
    >
      {/* Hexagon frame using rotated squares trick — two overlapping rotated rectangles */}
      <View
        style={[
          styles.hexLayer,
          {
            width: hexWidth,
            height: hexHeight,
            borderRadius: cornerRadius,
            backgroundColor: colors.glassBg,
            borderColor: colors.glassBorder,
            borderWidth: 1.5,
            transform: [{ rotate: '0deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.hexLayer,
          {
            width: hexWidth,
            height: hexHeight,
            borderRadius: cornerRadius,
            backgroundColor: 'transparent',
            borderColor: colors.glow,
            borderWidth: 0.5,
            opacity: 0.5,
          },
        ]}
      />
      {/* Inner highlight (top edge) */}
      <View
        pointerEvents="none"
        style={[
          styles.hexLayer,
          {
            width: hexWidth - 4,
            height: hexHeight - 4,
            borderRadius: cornerRadius - 2,
            borderColor: 'transparent',
            borderTopColor: colors.glassHighlight,
            borderWidth: 1,
            opacity: 0.35,
          },
        ]}
      />

      {/* P/L monogram */}
      <View style={[styles.monogram, { width: monogramSize, height: monogramSize }]}>
        {/* "P" — vertical bar + bowl */}
        <View
          style={[
            styles.pStem,
            {
              width: monogramSize * 0.22,
              height: monogramSize,
              backgroundColor: colors.gradientStart,
              borderTopLeftRadius: monogramSize * 0.08,
              borderBottomLeftRadius: monogramSize * 0.08,
            },
          ]}
        />
        <View
          style={[
            styles.pBowl,
            {
              left: monogramSize * 0.22,
              width: monogramSize * 0.45,
              height: monogramSize * 0.45,
              borderTopRightRadius: monogramSize * 0.22,
              borderBottomRightRadius: monogramSize * 0.22,
              borderTopLeftRadius: monogramSize * 0.04,
              borderBottomLeftRadius: monogramSize * 0.04,
              backgroundColor: colors.gradientMid,
            },
          ]}
        />
        {/* "L" — vertical bar + horizontal foot */}
        <View
          style={[
            styles.lStem,
            {
              left: monogramSize * 0.55,
              width: monogramSize * 0.22,
              height: monogramSize,
              backgroundColor: colors.gradientEnd,
              borderTopRightRadius: monogramSize * 0.04,
              borderBottomRightRadius: monogramSize * 0.04,
            },
          ]}
        />
        <View
          style={[
            styles.lFoot,
            {
              left: monogramSize * 0.55,
              bottom: 0,
              width: monogramSize * 0.42,
              height: monogramSize * 0.22,
              backgroundColor: colors.gradientEnd,
              borderBottomLeftRadius: monogramSize * 0.08,
              borderBottomRightRadius: monogramSize * 0.04,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  hexLayer: {
    position: 'absolute',
  },
  monogram: {
    position: 'relative',
  },
  pStem: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  pBowl: {
    position: 'absolute',
    top: 0,
  },
  lStem: {
    position: 'absolute',
    top: 0,
  },
  lFoot: {
    position: 'absolute',
  },
});
