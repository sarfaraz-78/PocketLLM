import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../theme/tokens';
import { TierBadge } from '../components/TierBadge';
import { DeviceTierDetector } from '../inference/DeviceTierDetector';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Slider } from '../components/ui/Slider';

export const SettingsScreen: React.FC = () => {
  const {
    deviceTier,
    tierOverride,
    systemPrompt,
    completionSettings,
    darkMode,
    enableThinking,
    codingMode,
    turboQuantEnabled,
    setTierOverride,
    setSystemPrompt,
    setCompletionSettings,
    setDarkMode,
    setEnableThinking,
    setCodingMode,
    setTurboQuantEnabled,
    resetToDefaults,
  } = useSettingsStore();
  const { colors, isDark } = useTheme();

  const [deviceProfile, setDeviceProfile] = useState<{
    cpuModel: string;
    ramGB: number;
    gpuName: string;
    abis: string[];
  } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await DeviceTierDetector.detect();
        setDeviceProfile({
          cpuModel: profile.cpuModel || 'Unknown',
          ramGB: profile.ramGB,
          gpuName: profile.gpuName || 'CPU',
          abis: profile.abis || [],
        });
      } catch {
        // silently ignore
      }
    };
    loadProfile();
  }, []);

  const handleReset = () => {
    Alert.alert('Reset Settings', 'Reset all configuration settings back to defaults? Your workspaces and files will NOT be touched.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset Settings', style: 'destructive', onPress: () => { 
        resetToDefaults(); 
        Alert.alert('Reset Complete', 'System settings have been restored.'); 
      } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>

        {(deviceTier || deviceProfile) && (
          <Card style={styles.card} darkMode={darkMode}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Device</Text>
            <View style={styles.tierRow}>
              {deviceTier && <TierBadge tier={deviceTier} size="large" />}
              {tierOverride && (
                <Text style={[styles.overrideText, { color: colors.warning }]}>(Overridden)</Text>
              )}
            </View>
            {deviceProfile && (
              <View style={[styles.hardwareInfo, { borderTopColor: colors.border }]}>
                <View style={styles.hardwareRow}>
                  <Icon name="hardware-chip-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.hardwareText, { color: colors.textSecondary }]}>{deviceProfile.cpuModel}</Text>
                </View>
                <View style={styles.hardwareRow}>
                  <Icon name="memory-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.hardwareText, { color: colors.textSecondary }]}>{deviceProfile.ramGB} GB RAM · {deviceProfile.gpuName}</Text>
                </View>
                <View style={styles.hardwareRow}>
                  <Icon name="code-slash-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.hardwareText, { color: colors.textSecondary }]}>{deviceProfile.abis.join(', ') || '64-bit'}</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.card} darkMode={darkMode}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>TurboQuant Engine</Text>
          <SettingRow icon="flash" label="Enable TurboQuant" darkMode={darkMode} colors={colors}>
            <Switch 
              value={turboQuantEnabled} 
              onValueChange={setTurboQuantEnabled} 
              trackColor={{ false: colors.border, true: colors.primary }} 
              thumbColor="#FFFFFF" 
            />
          </SettingRow>
          {turboQuantEnabled && (
            <View style={[styles.turboInfo, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
              <Icon name="speedometer" size={16} color={colors.primary} />
              <Text style={[styles.turboText, { color: colors.textSecondary }]}>
                Hardware-accelerated Vulkan/Metal GPU offloading, FlashAttention, and optimized mlock memory pinning are active to boost local generation speed by up to 2.5x!
              </Text>
            </View>
          )}
        </Card>

        <Card style={styles.card} darkMode={darkMode}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Appearance</Text>
          <SettingRow icon="moon-outline" label="Dark Mode" darkMode={darkMode} colors={colors}>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
          </SettingRow>
          <SettingRow icon="code-slash-outline" label="Coding Mode" darkMode={darkMode} colors={colors}>
            <Switch value={codingMode} onValueChange={setCodingMode} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
          </SettingRow>
          <SettingRow icon="brain-outline" label="Enable Thinking" darkMode={darkMode} colors={colors}>
            <Switch value={enableThinking} onValueChange={setEnableThinking} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
          </SettingRow>
        </Card>

        <Card style={styles.card} darkMode={darkMode}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>System Prompt</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.border }]}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            numberOfLines={5}
            placeholder="You are a helpful assistant..."
            placeholderTextColor={colors.textTertiary}
            textAlignVertical="top"
          />
        </Card>

        <Card style={styles.card} darkMode={darkMode}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Generation Settings</Text>
          <Slider
            label="Temperature"
            value={completionSettings.temperature}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => setCompletionSettings({ temperature: v })}
            formatValue={(v) => v.toFixed(2)}
            darkMode={darkMode}
          />
          <Slider
            label="Top P"
            value={completionSettings.top_p}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setCompletionSettings({ top_p: v })}
            formatValue={(v) => v.toFixed(2)}
            darkMode={darkMode}
          />
          <Slider
            label="Top K"
            value={completionSettings.top_k}
            min={1}
            max={100}
            step={1}
            onChange={(v) => setCompletionSettings({ top_k: v })}
            formatValue={(v) => Math.round(v).toString()}
            darkMode={darkMode}
          />
          <Slider
            label="Max Tokens"
            value={completionSettings.n_predict}
            min={64}
            max={4096}
            step={64}
            onChange={(v) => setCompletionSettings({ n_predict: v })}
            formatValue={(v) => Math.round(v).toString()}
            darkMode={darkMode}
          />
          <Slider
            label="Repeat Penalty"
            value={completionSettings.penalty_repeat}
            min={1}
            max={2}
            step={0.05}
            onChange={(v) => setCompletionSettings({ penalty_repeat: v })}
            formatValue={(v) => v.toFixed(2)}
            darkMode={darkMode}
          />
        </Card>

        <Card style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1 }]} darkMode={darkMode}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>System Reset</Text>
          <Text style={[styles.maintenanceText, { color: colors.textSecondary, marginBottom: SPACING.md }]}>
            Restoring defaults will reset system prompts, hardware speedup settings, and parameters. Your projects and workspace files will remain completely safe.
          </Text>
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                borderColor: '#EF4444',
                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.03)',
              }
            ]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Icon name="refresh-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.resetButtonText}>Reset Settings to Default</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.madeIn}>
          <Text style={[styles.madeInText, { color: colors.textSecondary }]}>Made with</Text>
          <Icon name="heart" size={14} color="#E11D48" />
          <Text style={[styles.madeInText, { color: colors.textSecondary }]}>in India</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface SettingRowProps {
  icon: string;
  label: string;
  children: React.ReactNode;
  darkMode: boolean;
  colors: any;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, children, darkMode, colors }) => (
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 110 },
  pageTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', marginBottom: SPACING.lg },
  card: { marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.md },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  overrideText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  hardwareInfo: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1 },
  hardwareRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  hardwareText: { fontSize: FONT_SIZES.sm, fontWeight: '400', marginLeft: SPACING.sm },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', marginLeft: SPACING.md },
  settingIcon: { width: 36, height: 36, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: FONT_SIZES.md, fontWeight: '500', marginLeft: SPACING.md },
  textInput: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.lg, fontSize: FONT_SIZES.md, minHeight: 120, lineHeight: 22 },
  madeIn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.xxl },
  madeInText: { fontSize: FONT_SIZES.sm, fontWeight: '500' },
  turboInfo: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.md,
    alignItems: 'flex-start',
  },
  turboText: {
    fontSize: FONT_SIZES.xs + 1,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  maintenanceText: {
    fontSize: FONT_SIZES.xs + 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
