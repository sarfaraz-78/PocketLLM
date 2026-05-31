import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  onPress?: () => void;
  darkMode?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  onPress,
  darkMode = true,
}) => {
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const getBgColor = () => {
    switch (variant) {
      case 'primary': return colors.primary + '15';
      case 'secondary': return colors.surfaceVariant;
      case 'success': return colors.success + '15';
      case 'warning': return colors.warning + '15';
      case 'error': return colors.error + '15';
      case 'info': return colors.info + '15';
      default: return colors.primary + '15';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.textSecondary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.info;
      default: return colors.primary;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 2, paddingHorizontal: SPACING.sm };
      case 'lg': return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg };
      default: return { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return FONT_SIZES.xs;
      case 'lg': return FONT_SIZES.md;
      default: return FONT_SIZES.sm;
    }
  };

  const content = (
    <View style={[styles.badge, { backgroundColor: getBgColor() }, getPadding()]}>
      {icon && (
        <Icon name={icon} size={getFontSize() + 2} color={getTextColor()} style={styles.icon} />
      )}
      <Text style={[styles.label, { color: getTextColor(), fontSize: getFontSize() }]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
  },
});