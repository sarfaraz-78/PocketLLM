import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { DeviceTier } from '../types';
import { TierBadge } from '../components/TierBadge';

export const SettingsScreen: React.FC = () => {
  const {
    deviceTier,
    tierOverride,
    systemPrompt,
    completionSettings,
    darkMode,
    setTierOverride,
    setSystemPrompt,
    setCompletionSettings,
    setDarkMode,
    resetToDefaults,
  } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('Success', 'Settings reset to defaults');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {deviceTier && (
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.md]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Device Tier
          </Text>
          <View style={styles.tierRow}>
            <TierBadge tier={deviceTier} size="large" />
            {tierOverride && (
              <Text style={[styles.overrideText, { color: colors.warning }]}>
                (Overridden)
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.md]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Icon name="moon-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Dark Mode
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.md]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          System Prompt
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          multiline
          numberOfLines={4}
          placeholder="Enter system prompt..."
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.md]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Generation Settings
        </Text>

        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            Temperature: {completionSettings.temperature.toFixed(2)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2}
            value={completionSettings.temperature}
            onValueChange={(value) =>
              setCompletionSettings({ temperature: value })
            }
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            Top P: {completionSettings.top_p.toFixed(2)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={completionSettings.top_p}
            onValueChange={(value) => setCompletionSettings({ top_p: value })}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            Top K: {completionSettings.top_k}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={completionSettings.top_k}
            onValueChange={(value) => setCompletionSettings({ top_k: value })}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            Max Tokens: {completionSettings.n_predict}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={64}
            maximumValue={2048}
            step={64}
            value={completionSettings.n_predict}
            onValueChange={(value) =>
              setCompletionSettings({ n_predict: value })
            }
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={[styles.sliderLabel, { color: colors.text }]}>
            Repeat Penalty: {completionSettings.penalty_repeat.toFixed(2)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={2}
            value={completionSettings.penalty_repeat}
            onValueChange={(value) =>
              setCompletionSettings({ penalty_repeat: value })
            }
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: colors.error }]}
        onPress={handleReset}
      >
        <Icon name="refresh-outline" size={20} color="#FFFFFF" />
        <Text style={styles.resetButtonText}>Reset to Defaults</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
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
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overrideText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sliderContainer: {
    marginBottom: SPACING.md,
  },
  sliderLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  resetButton: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});
