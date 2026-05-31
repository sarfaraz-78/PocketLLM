import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  darkMode?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'lg',
  darkMode = true,
}) => {
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const getShadow = () => {
    switch (variant) {
      case 'elevated': return SHADOWS.md;
      case 'outlined': return {};
      default: return SHADOWS.sm;
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case 'outlined': return 'transparent';
      default: return colors.surface;
    }
  };

  const getBorder = () => {
    if (variant === 'outlined') {
      return { borderWidth: 1, borderColor: colors.border };
    }
    return {};
  };

  const paddingValue = {
    none: 0,
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBgColor(),
          padding: paddingValue[padding],
        },
        getShadow(),
        getBorder(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
  },
});