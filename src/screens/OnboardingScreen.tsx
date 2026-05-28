import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { DeviceTierDetector } from '../inference/DeviceTierDetector';
import { DeviceProfile, DeviceTier } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { TierBadge } from '../components/TierBadge';

export const OnboardingScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { setDeviceTier, setOnboardingComplete, darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Detecting device capabilities...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Icon name="rocket" size={80} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to PocketLLM
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Run AI models locally on your device
        </Text>
      </View>

      {deviceProfile && (
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.md]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Your Device
          </Text>

          <View style={styles.infoRow}>
            <Icon name="phone-portrait-outline" size={24} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Platform
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {deviceProfile.platform === 'ios' ? 'iOS' : 'Android'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="hardware-chip-outline" size={24} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                RAM
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {deviceProfile.ramGB} GB
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="speedometer-outline" size={24} color={colors.primary} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Performance Tier
              </Text>
              <TierBadge tier={deviceProfile.tier} size="medium" />
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon
              name={deviceProfile.gpuAvailable ? 'flash' : 'flash-off'}
              size={24}
              color={deviceProfile.gpuAvailable ? colors.success : colors.textTertiary}
            />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                GPU Acceleration
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {deviceProfile.gpuAvailable
                  ? `Available (${deviceProfile.gpuName})`
                  : 'Not Available'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.md]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          What This Means
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {DeviceTierDetector.getTierDescription(deviceProfile?.tier || DeviceTier.MEDIUM)}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          We'll recommend models optimized for your device. You can always adjust settings later.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <Icon name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  description: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: SPACING.sm,
  },
});
