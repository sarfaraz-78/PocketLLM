import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useAnimatedRotation } from '../hooks/useAnimatedRotation';
import { useShimmer } from '../hooks/useShimmer';
import { usePulse } from '../hooks/usePulse';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ELEVATION } from '../theme/tokens';

interface ReasoningCardProps {
  content: string;
  isActive: boolean;
  defaultExpanded?: boolean;
}

const ReasoningCardBase: React.FC<ReasoningCardProps> = ({
  content,
  isActive,
  defaultExpanded,
}) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded ?? isActive);
  const expandAnim = useRef(new Animated.Value(defaultExpanded ?? isActive ? 1 : 0)).current;
  const rotation = useAnimatedRotation(8000, isActive);
  const shimmerX = useShimmer(isActive, 2200);
  const pulseOpacity = usePulse(isActive, 1500, 0.4);

  useEffect(() => {
    // Auto-expand when active, collapse when finished
    const targetValue = isActive ? 1 : 0;
    setExpanded(targetValue === 1);
    Animated.spring(expandAnim, {
      toValue: targetValue,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [isActive]);

  if (!content && !isActive) return null;

  const characterCount = content.length;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: isActive ? colors.primary + '50' : colors.border,
          },
          ELEVATION[isActive ? 2 : 1],
        ]}
      >
        {/* Shimmer overlay when active */}
        {isActive && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmerOverlay,
              {
                backgroundColor: colors.primary,
                transform: [{ translateX: shimmerX }],
              },
            ]}
          />
        )}

        <TouchableOpacity
          onPress={() => {
            const next = !expanded;
            setExpanded(next);
            Animated.spring(expandAnim, {
              toValue: next ? 1 : 0,
              useNativeDriver: false,
              tension: 80,
              friction: 10,
            }).start();
          }}
          activeOpacity={0.85}
          style={styles.header}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Icon
              name="sparkles"
              size={14}
              color={isActive ? colors.primary : colors.textTertiary}
            />
          </Animated.View>
          <Text style={[styles.label, { color: isActive ? colors.primary : colors.textSecondary }]}>
            Reasoning
          </Text>
          {isActive && (
            <Animated.View
              style={[
                styles.activeDot,
                { backgroundColor: colors.primary, opacity: pulseOpacity },
              ]}
            />
          )}
          {!isActive && characterCount > 0 && (
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>
              · {characterCount} chars
            </Text>
          )}
          <View style={styles.spacer} />
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textTertiary}
          />
        </TouchableOpacity>

        <Animated.View
          style={{
            maxHeight: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 400],
            }),
            opacity: expandAnim,
            overflow: 'hidden',
          }}
        >
          <View style={[styles.contentBox, { borderTopColor: colors.divider }]}>
            <Text
              style={[
                styles.contentText,
                {
                  color: colors.textSecondary,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                },
              ]}
              selectable
            >
              {content || 'Formulating reasoning...'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const areReasoningEqual = (
  prev: ReasoningCardProps,
  next: ReasoningCardProps
): boolean => {
  return (
    prev.isActive === next.isActive &&
    prev.content === next.content &&
    prev.defaultExpanded === next.defaultExpanded
  );
};

export const ReasoningCard = React.memo(ReasoningCardBase, areReasoningEqual);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.xs,
  },
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    opacity: 0.05,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
  },
  spacer: {
    flex: 1,
  },
  contentBox: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  contentText: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
  },
});
