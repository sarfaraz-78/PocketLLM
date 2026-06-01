import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../store/useSettingsStore';
import { useHaptics } from '../services/Haptics';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS, ELEVATION } from '../theme/tokens';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  target?: { x: number; y: number; width: number; height: number };
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTourBase: React.FC<OnboardingTourProps> = ({
  steps,
  visible,
  onComplete,
  onSkip,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIndex(0);
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      fade.setValue(0);
    }
  }, [visible]);

  if (!visible || steps.length === 0) return null;

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const next = () => {
    haptics.selection();
    if (isLast) {
      onComplete();
    } else {
      setIndex(index + 1);
    }
  };

  const skip = () => {
    haptics.light();
    onSkip();
  };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={skip} />

        <View style={styles.tooltipWrap} pointerEvents="box-none">
          <View
            style={[
              styles.tooltip,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
              ELEVATION[4],
            ]}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Icon name={step.icon} size={28} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {step.description}
            </Text>

            <View style={styles.dotsRow}>
              {steps.map((s, i) => (
                <View
                  key={s.id}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === index ? colors.primary : colors.divider,
                      width: i === index ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={skip} hitSlop={6}>
                <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={next}
                style={[styles.next, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={styles.nextText}>
                  {isLast ? 'Get Started' : 'Next'}
                </Text>
                <Icon name={isLast ? 'checkmark' : 'arrow-forward'} size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

export const OnboardingTour = React.memo(OnboardingTourBase);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  tooltipWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.xl,
  },
  tooltip: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.black,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: SPACING.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    padding: SPACING.xs,
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  nextText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
