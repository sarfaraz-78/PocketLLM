import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { DeviceTierDetector } from '../inference/DeviceTierDetector';
import { DeviceProfile, DeviceTier } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';

export const OnboardingScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { setDeviceTier, setOnboardingComplete, darkMode } = useSettingsStore();
  const _COLORS = COLORS;
  const _defaultColors = { primary: '#14B8A6', surface: '#1E293B', background: '#0F172A', border: '#334155', textTertiary: '#64748B', text: '#F8FAFC', textSecondary: '#CBD5E1', divider: '#1E293B', primaryLight: '#5EEAD4', primaryDark: '#0D9488', secondary: '#22D3EE', accent: '#FBBF24', surfaceVariant: '#334155', surfaceElevated: '#1E293B', error: '#F87171', success: '#34D399', warning: '#FBBF24', info: '#60A5FA', userBubble: '#14B8A6', assistantBubble: '#334155', userBubbleText: '#FFFFFF', assistantBubbleText: '#F8FAFC', inputBackground: '#1E293B', overlay: 'rgba(0, 0, 0, 0.6)', gradientStart: '#14B8A6', gradientEnd: '#22D3EE' };
  const colors = _COLORS ? (_COLORS[darkMode ? 'dark' : 'light']) : _defaultColors;

  useEffect(() => {
    detectDevice();
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
    setOnboardingComplete(true);
    navigation.replace('Main');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analyzing device...
          </Text>
        </View>
      </View>
    );
  }

  const tierColor = getTierColor(deviceProfile?.tier || DeviceTier.MEDIUM);
  const tierLabel = DeviceTierDetector.getTierDescription(deviceProfile?.tier || DeviceTier.MEDIUM);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
          <Icon name="hardware-chip-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          PocketLLM
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Run AI privately on your device
        </Text>
      </View>

      {/* Device Card */}
      {deviceProfile && (
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <View style={styles.cardHeader}>
            <Icon name="phone-portrait-outline" size={18} color={colors.textTertiary} />
            <Text style={[styles.cardHeaderText, { color: colors.textSecondary }]}>
              Device Profile
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

          <View style={[styles.tierBadge, { backgroundColor: tierColor + '14' }]}>
            <Text style={[styles.tierBadgeText, { color: tierColor }]}>
              {tierLabel}
            </Text>
          </View>
        </View>
      )}

      {/* Info Cards */}
      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.success + '14' }]}>
            <Icon name="shield-checkmark-outline" size={20} color={colors.success} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>100% Private</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              All inference runs locally. No data leaves your device.
            </Text>
          </View>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.accent + '14' }]}>
            <Icon name="flash-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Offline First</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              Works without internet. Download models once, use anywhere.
            </Text>
          </View>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.warning + '14' }]}>
            <Icon name="git-merge-outline" size={20} color={colors.warning} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Open Source</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              Powered by llama.cpp. Community models ready to use.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <Icon name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const getTierColor = (tier: DeviceTier): string => {
  switch (tier) {
    case DeviceTier.ULTRA_LOW: return '#EF4444';
    case DeviceTier.LOW: return '#F59E0B';
    case DeviceTier.MEDIUM: return '#0D9488';
    case DeviceTier.HIGH: return '#10B981';
    case DeviceTier.PREMIUM: return '#06B6D4';
  }
};

const StatItem: React.FC<any> = ({ icon, label, value, valueColor, colors }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={18} color={colors.textTertiary} />
    <Text style={[styles.statValue, { color: valueColor || colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.hero,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardHeaderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  tierBadge: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
  },
  tierBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextBox: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  infoDivider: {
    height: 1,
    marginVertical: SPACING.lg,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
});
