import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ELEVATION, getThemeColors, ThemeName } from '../../theme/tokens';
import { ToastOptions } from '../../hooks/useToast';

interface ToastItemProps extends ToastOptions {
  id: string;
  onDismiss: (id: string) => void;
  index: number;
  themeName: ThemeName;
}

const getVariantConfig = (variant: ToastOptions['variant'], themeColors: ReturnType<typeof getThemeColors>) => {
  switch (variant) {
    case 'success':
      return { icon: 'checkmark-circle', color: themeColors.success, bg: themeColors.success + '15', border: themeColors.success + '40' };
    case 'error':
      return { icon: 'alert-circle', color: themeColors.error, bg: themeColors.error + '15', border: themeColors.error + '40' };
    case 'warning':
      return { icon: 'warning', color: themeColors.warning, bg: themeColors.warning + '15', border: themeColors.warning + '40' };
    case 'info':
    default:
      return { icon: 'information-circle', color: themeColors.primary, bg: themeColors.primary + '15', border: themeColors.primary + '40' };
  }
};

export const ToastItem: React.FC<ToastItemProps> = ({
  id,
  message,
  variant = 'info',
  duration = 3000,
  action,
  onDismiss,
  index,
  themeName,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const themeColors = getThemeColors(themeName);
  const config = getVariantConfig(variant, themeColors);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    if (duration > 0) {
      Animated.timing(progress, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss(id));
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAction = () => {
    action?.onPress();
    onDismiss(id);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface,
          borderColor: config.border,
          transform: [{ translateY }, { scale }],
          opacity,
          marginTop: index * 8,
        },
        ELEVATION[3],
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
        <Icon name={config.icon} size={20} color={config.color} />
      </View>
      <Text style={[styles.message, { color: themeColors.text }]} numberOfLines={2}>
        {message}
      </Text>
      {action && (
        <TouchableOpacity onPress={handleAction} style={styles.actionButton} activeOpacity={0.7}>
          <Text style={[styles.actionText, { color: config.color }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => onDismiss(id)} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size={16} color={themeColors.textTertiary} />
      </TouchableOpacity>
      {duration > 0 && (
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: config.color, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginHorizontal: SPACING.lg,
    minHeight: 56,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
});
