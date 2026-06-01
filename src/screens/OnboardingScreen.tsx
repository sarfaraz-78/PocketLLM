import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { DeviceTierDetector } from '../inference/DeviceTierDetector';
import { DeviceProfile, DeviceTier } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../theme/tokens';
import { Logo } from '../components/Logo';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientText } from '../components/ui/GradientText';
import { useHaptics } from '../services/Haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OnboardingScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setDeviceTier, setOnboardingComplete } = useSettingsStore();
  const floatAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    detectDevice();
    // Gentle floating animation for ambient feel
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const detectDevice = async () => {
    try {
      const profile = await DeviceTierDetector.detect();
      setDeviceProfile(profile);
      setDeviceTier(profile.tier);
    } catch (error) {
      console.error('Error detecting device:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    haptics.medium();
    setOnboardingComplete(true);
    navigation.replace('Main');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analyzing device...
          </Text>
        </View>
      </View>
    );
  }

  const tierColor = getTierColor(deviceProfile?.tier || DeviceTier.MEDIUM, colors);
  const tierLabel = DeviceTierDetector.getTierDescription(
    deviceProfile?.tier || DeviceTier.MEDIUM
  );

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Ambient background gradient orbs */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.orb,
            {
              top: -80,
              right: -60,
              backgroundColor: colors.glow,
              opacity: 0.35,
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              bottom: 120,
              left: -100,
              width: 260,
              height: 260,
              borderRadius: 130,
              backgroundColor: colors.primary,
              opacity: 0.18,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={[styles.header, { transform: [{ translateY: floatY }] }]}>
          <Logo size={120} />
          <View style={styles.titleBlock}>
            <GradientText size={42} weight="800" style={styles.title}>
              PocketLLM
            </GradientText>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Run AI privately on your device
            </Text>
          </View>
        </Animated.View>

        {/* Device profile card */}
        {deviceProfile && (
          <GlassCard variant="default" padding={22} style={styles.section}>
            <View style={styles.cardLabel}>
              <Icon name="phone-portrait-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.cardLabelText, { color: colors.textTertiary }]}>
                DEVICE PROFILE
              </Text>
            </View>
            <View style={styles.statsRow}>
              <StatItem
                icon="logo-android"
                label="Platform"
                value={deviceProfile.platform === 'ios' ? 'iOS' : 'Android'}
                colors={colors}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <StatItem
                icon="hardware-chip-outline"
                label="RAM"
                value={`${deviceProfile.ramGB} GB`}
                colors={colors}
              />
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <StatItem
                icon="speedometer-outline"
                label="Tier"
                value={deviceProfile.tier}
                valueColor={tierColor}
                colors={colors}
              />
            </View>
            <View
              style={[
                styles.tierBadge,
                {
                  backgroundColor: tierColor + '1A',
                  borderColor: tierColor + '40',
                },
              ]}
            >
              <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                {tierLabel}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Features */}
        <GlassCard variant="default" padding={8} style={styles.section}>
          <FeatureRow
            icon="shield-checkmark"
            color={colors.success}
            title="100% Private"
            desc="All inference runs locally. No data leaves your device."
            colors={colors}
          />
          <View style={[styles.featureDivider, { backgroundColor: colors.divider }]} />
          <FeatureRow
            icon="flash"
            color={colors.accent}
            title="Offline First"
            desc="Works without internet. Download models once, use anywhere."
            colors={colors}
          />
          <View style={[styles.featureDivider, { backgroundColor: colors.divider }]} />
          <FeatureRow
            icon="git-merge"
            color={colors.warning}
            title="Open Source"
            desc="Powered by llama.cpp. Community models ready to use."
            colors={colors}
          />
        </GlassCard>

        {/* CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.gradientMid,
              shadowColor: colors.glowStrong,
            },
          ]}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Icon name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={[styles.versionLabel, { color: colors.textTertiary }]}>
          v3.1.0 · Aurora Glass
        </Text>
      </ScrollView>
    </View>
  );
};

const getTierColor = (tier: DeviceTier, colors: any): string => {
  switch (tier) {
    case DeviceTier.ULTRA_LOW: return '#EF4444';
    case DeviceTier.LOW: return '#F59E0B';
    case DeviceTier.MEDIUM: return colors.primary;
    case DeviceTier.HIGH: return '#10B981';
    case DeviceTier.PREMIUM: return '#06B6D4';
    default: return colors.primary;
  }
};

const StatItem: React.FC<any> = ({ icon, label, value, valueColor, colors }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={18} color={colors.textTertiary} />
    <Text style={[styles.statValue, { color: valueColor || colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const FeatureRow: React.FC<any> = ({ icon, color, title, desc, colors }) => (
  <View style={styles.featureRow}>
    <View
      style={[
        styles.featureIcon,
        {
          backgroundColor: color + '1F',
          borderColor: color + '30',
        },
      ]}
    >
      <Icon name={icon} size={20} color={color} />
    </View>
    <View style={styles.featureText}>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg + 4 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.md, fontSize: FONT_SIZES.base, fontWeight: '500' },
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    shadowColor: '#000',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  titleBlock: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  title: {
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.base,
  },
  cardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs + 2,
  },
  cardLabelText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginTop: SPACING.sm,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statDivider: { width: 1, height: 40, opacity: 0.6 },
  tierBadge: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    alignSelf: 'center',
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  featureText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  featureTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  featureDivider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    paddingVertical: SPACING.base + 2,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  versionLabel: {
    textAlign: 'center',
    marginTop: SPACING.base,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
