import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeviceTier } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

interface TierBadgeProps {
  tier: DeviceTier;
  size?: 'small' | 'medium' | 'large';
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'medium',
}) => {
  const getTierColor = () => {
    switch (tier) {
      case DeviceTier.ULTRA_LOW:
        return COLORS.light.error;
      case DeviceTier.LOW:
        return COLORS.light.warning;
      case DeviceTier.MEDIUM:
        return COLORS.light.info;
      case DeviceTier.HIGH:
        return COLORS.light.success;
      case DeviceTier.PREMIUM:
        return COLORS.light.primary;
    }
  };

  const getTierLabel = () => {
    switch (tier) {
      case DeviceTier.ULTRA_LOW:
        return 'Ultra Low';
      case DeviceTier.LOW:
        return 'Low';
      case DeviceTier.MEDIUM:
        return 'Medium';
      case DeviceTier.HIGH:
        return 'High';
      case DeviceTier.PREMIUM:
        return 'Premium';
    }
  };

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: SPACING.xs, paddingVertical: 2 },
      text: { fontSize: FONT_SIZES.xs },
    },
    medium: {
      container: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
      text: { fontSize: FONT_SIZES.sm },
    },
    large: {
      container: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
      text: { fontSize: FONT_SIZES.md },
    },
  };

  return (
    <View
      style={[
        styles.container,
        sizeStyles[size].container,
        { backgroundColor: getTierColor() },
      ]}
    >
      <Text style={[styles.text, sizeStyles[size].text]}>
        {getTierLabel()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
