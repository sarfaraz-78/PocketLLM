import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../../theme/tokens';
import { useHaptics } from '../../services/Haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  glow = false,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  const getBgColor = (): string => {
    if (disabled) return colors.surfaceVariant;
    switch (variant) {
      case 'primary':
        return colors.gradientMid;
      case 'secondary':
        return colors.surfaceVariant;
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return colors.error;
      case 'glass':
        return colors.glassBg;
      default:
        return colors.gradientMid;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      case 'danger':
        return '#FFFFFF';
      case 'glass':
        return colors.text;
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') return colors.primary;
    if (variant === 'glass') return colors.glassBorder;
    return 'transparent';
  };

  const getShadow = (): ViewStyle => {
    if (disabled) return {};
    if (variant === 'primary' || glow) {
      return {
        shadowColor: colors.glow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 8,
      };
    }
    if (variant === 'glass') {
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
      };
    }
    return {};
  };

  const sizeStyles = {
    sm: { paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md + 2, fontSize: FONT_SIZES.sm, iconSize: 14 },
    md: { paddingVertical: SPACING.md + 2, paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.md, iconSize: 18 },
    lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl, fontSize: FONT_SIZES.lg, iconSize: 20 },
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: getBgColor(),
            borderColor: getBorderColor(),
            borderWidth: variant === 'outline' || variant === 'glass' ? 1.5 : 0,
            paddingVertical: sizeStyles[size].paddingVertical,
            paddingHorizontal: sizeStyles[size].paddingHorizontal,
          },
          getShadow(),
          fullWidth && { width: '100%' },
          style,
        ]}
        onPress={handlePress}
        onPressIn={() => animatePress(0.96)}
        onPressOut={() => animatePress(1)}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator size="small" color={getTextColor()} />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <Icon
                name={icon}
                size={sizeStyles[size].iconSize}
                color={getTextColor()}
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.text,
                { color: getTextColor(), fontSize: sizeStyles[size].fontSize },
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <Icon
                name={icon}
                size={sizeStyles[size].iconSize}
                color={getTextColor()}
                style={styles.iconRight}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: SPACING.xs + 2,
  },
  iconRight: {
    marginLeft: SPACING.xs + 2,
  },
});
