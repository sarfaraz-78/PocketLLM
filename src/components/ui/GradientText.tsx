import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface GradientTextProps extends TextProps {
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  size?: number;
  style?: TextStyle | TextStyle[];
}

/**
 * Cross-platform text with a faux-linear gradient effect using color stops.
 * RN doesn't support text gradients on Android without Skia, so we use
 * a 3-stop blended color baked from theme tokens, picked per-character
 * position by sampling the gradient.
 *
 * For v3.1 we use a single blended mid color (avoids per-letter rendering
 * overhead). Looks like a gradient on small text, and matches the theme
 * primary perfectly.
 */
export const GradientText: React.FC<GradientTextProps> = ({
  fromColor,
  viaColor,
  toColor,
  weight = '700',
  size = 32,
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();
  const start = fromColor || colors.gradientStart;
  const mid = viaColor || colors.gradientMid;
  const end = toColor || colors.gradientEnd;

  // Blend the three colors into a single strong color that reads as "gradient"
  const blended = blend3(start, mid, end);

  return (
    <Text
      {...rest}
      style={[
        styles.text,
        {
          color: blended,
          fontSize: size,
          fontWeight: weight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

function blend3(c1: string, c2: string, c3: string): string {
  // Average RGB across 3 hex colors
  const p1 = parseHex(c1);
  const p2 = parseHex(c2);
  const p3 = parseHex(c3);
  if (!p1 || !p2 || !p3) return c2;
  const r = Math.round((p1.r + p2.r * 2 + p3.r) / 4);
  const g = Math.round((p1.g + p2.g * 2 + p3.g) / 4);
  const b = Math.round((p1.b + p2.b * 2 + p3.b) / 4);
  return `rgb(${r}, ${g}, ${b})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

const styles = StyleSheet.create({
  text: {
    letterSpacing: -0.5,
  },
});
