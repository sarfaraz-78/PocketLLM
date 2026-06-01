import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../../theme/tokens';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  onPress?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  onPress,
}) => {
  const { colors } = useTheme();

  const getBgColor = () => {
    switch (variant) {
      case 'primary': return colors.highlight;
      case 'secondary': return colors.glassBg;
      case 'success': return colors.success + '20';
      case 'warning': return colors.warning + '20';
      case 'error': return colors.error + '20';
      case 'info': return colors.info + '20';
      case 'glass': return colors.glassBg;
      default: return colors.highlight;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return colors.primaryLight;
      case 'secondary': return colors.textSecondary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.info;
      case 'glass': return colors.text;
      default: return colors.primaryLight;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 3, paddingHorizontal: SPACING.sm };
      case 'lg': return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
      default: return { paddingVertical: 4, paddingHorizontal: SPACING.sm + 2 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return FONT_SIZES.xs;
      case 'lg': return FONT_SIZES.base;
      default: return FONT_SIZES.sm;
    }
  };

  const content = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBgColor(),
          borderColor: variant === 'glass' ? colors.glassBorder : 'transparent',
          borderWidth: variant === 'glass' ? 1 : 0,
        },
        getPadding(),
      ]}
    >
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
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
