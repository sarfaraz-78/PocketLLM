import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../theme/tokens';

interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

const EmptyStateBase: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Icon name={icon} size={36} color={colors.textTertiary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.action, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const EmptyState = React.memo(EmptyStateBase);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    maxWidth: 280,
  },
  action: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  actionText: {
    color: '#fff',
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },
});
