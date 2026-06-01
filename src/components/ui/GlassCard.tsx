import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, ELEVATION } from '../../theme/tokens';

export type GlassCardVariant = 'default' | 'elevated' | 'outlined' | 'subtle' | 'glow';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GlassCardVariant;
  radius?: keyof typeof RADIUS;
  padding?: number;
  onPress?: () => void;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  radius = 'xl',
  padding = 20,
  onPress,
  glow = false,
}) => {
  const { colors } = useTheme();

  const getBg = () => {
    switch (variant) {
      case 'subtle':
        return colors.glassBg;
      case 'outlined':
        return 'transparent';
      case 'elevated':
      case 'glow':
        return colors.glassBgStrong;
      default:
        return colors.glassBg;
    }
  };

  const getShadow = () => {
    if (glow || variant === 'glow') {
      return {
        shadowColor: colors.glowStrong,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 16,
        elevation: 8,
      };
    }
    switch (variant) {
      case 'elevated':
        return ELEVATION[3];
      case 'outlined':
      case 'subtle':
        return ELEVATION[1];
      default:
        return ELEVATION[2];
    }
  };

  const inner = (
    <View
      style={[
        {
          backgroundColor: getBg(),
          borderRadius: RADIUS[radius],
          borderWidth: variant === 'outlined' ? 1 : 1,
          borderColor: variant === 'outlined' ? colors.glassBorder : colors.glassBorder,
          padding,
          overflow: 'hidden',
        },
        getShadow(),
        style,
      ]}
    >
      {/* Top inner highlight */}
      <View
        pointerEvents="none"
        style={[
          styles.topHighlight,
          {
            backgroundColor: colors.glassHighlight,
            borderTopLeftRadius: RADIUS[radius],
            borderTopRightRadius: RADIUS[radius],
          },
        ]}
      />
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
};

const styles = StyleSheet.create({
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
});
