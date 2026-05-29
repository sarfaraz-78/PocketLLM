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
        return '#EF4444';
      case DeviceTier.LOW:
        return '#F59E0B';
      case DeviceTier.MEDIUM:
        return '#0D9488';
      case DeviceTier.HIGH:
        return '#10B981';
      case DeviceTier.PREMIUM:
        return '#06B6D4';
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
      container: { paddingHorizontal: 8, paddingVertical: 3 },
      text: { fontSize: FONT_SIZES.xs },
    },
    medium: {
      container: { paddingHorizontal: SPACING.md, paddingVertical: 5 },
      text: { fontSize: FONT_SIZES.sm },
    },
    large: {
      container: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
      text: { fontSize: FONT_SIZES.md },
    },
  };

  const color = getTierColor();

  return (
    <View
      style={[
        styles.container,
        sizeStyles[size].container,
        { backgroundColor: color + '14' },
      ]}
    >
      <Text style={[styles.text, sizeStyles[size].text, { color }]}>
        {getTierLabel()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
  },
});
