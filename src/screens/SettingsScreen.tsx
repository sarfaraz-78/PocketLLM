import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
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
    enableThinking,
    setTierOverride,
    setSystemPrompt,
    setCompletionSettings,
    setDarkMode,
    setEnableThinking,
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

  const SettingRow: React.FC<{
    icon: string;
    label: string;
    children: React.ReactNode;
  }> = ({ icon, label, children }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '10' }]}>
          <Icon name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>

      {deviceTier && (
        <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            Device
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

      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
          Appearance
        </Text>
        <SettingRow icon="moon-outline" label="Dark Mode">
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </SettingRow>
        <SettingRow icon="brain-outline" label="Enable Thinking">
          <Switch
            value={enableThinking}
            onValueChange={setEnableThinking}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </SettingRow>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
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
          numberOfLines={5}
          placeholder="You are a helpful assistant..."
          placeholderTextColor={colors.textTertiary}
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
          Generation Settings
        </Text>

        <SliderSetting
          label="Temperature"
          value={completionSettings.temperature}
          min={0}
          max={2}
          onChange={(v) => setCompletionSettings({ temperature: v })}
          colors={colors}
        />
        <SliderSetting
          label="Top P"
          value={completionSettings.top_p}
          min={0}
          max={1}
          onChange={(v) => setCompletionSettings({ top_p: v })}
          colors={colors}
        />
        <SliderSetting
          label="Top K"
          value={completionSettings.top_k}
          min={1}
          max={100}
          step={1}
          onChange={(v) => setCompletionSettings({ top_k: v })}
          colors={colors}
        />
        <SliderSetting
          label="Max Tokens"
          value={completionSettings.n_predict}
          min={64}
          max={4096}
          step={64}
          onChange={(v) => setCompletionSettings({ n_predict: v })}
          colors={colors}
        />
        <SliderSetting
          label="Repeat Penalty"
          value={completionSettings.penalty_repeat}
          min={1}
          max={2}
          onChange={(v) => setCompletionSettings({ penalty_repeat: v })}
          colors={colors}
        />
      </View>

      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: colors.error + '10' }]}
        onPress={handleReset}
        activeOpacity={0.8}
      >
        <Icon name="refresh-outline" size={18} color={colors.error} />
        <Text style={[styles.resetText, { color: colors.error }]}>Reset to Defaults</Text>
      </TouchableOpacity>

      {/* Made in India */}
      <View style={styles.madeIn}>
        <Text style={[styles.madeInText, { color: colors.textSecondary }]}>
          Made with
        </Text>
        <Icon name="heart" size={14} color="#E11D48" />
        <Text style={[styles.madeInText, { color: colors.textSecondary }]}>
          in India
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  colors: any;
}

const SliderSetting: React.FC<SliderSettingProps> = ({ label, value, min, max, step, onChange, colors }) => {
  const [display, setDisplay] = useState(value);
  const isInteger = step !== undefined && step >= 1;

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  const formatVal = (v: number) => {
    if (isInteger) return Math.round(v).toString();
    return v.toFixed(2);
  };

  return (
    <View style={styles.sliderBox}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.text }]}>{label}</Text>
        <View style={[styles.valueBadge, { backgroundColor: colors.primary + '12' }]}>
          <Text style={[styles.valueText, { color: colors.primary }]}>
            {formatVal(display)}
          </Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step ?? 0}
        value={value}
        onSlidingComplete={(v) => {
          const final = isInteger ? Math.round(v) : parseFloat(v.toFixed(2));
          setDisplay(final);
          onChange(final);
        }}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  overrideText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZES.md,
    minHeight: 120,
    lineHeight: 22,
  },
  sliderBox: {
    marginBottom: SPACING.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sliderLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  valueBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.md,
  },
  valueText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 32,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xxl,
    marginTop: SPACING.md,
  },
  resetText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  madeIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xxl,
  },
  madeInText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});
