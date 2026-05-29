import { create } from 'zustand';
import { AppSettings, CompletionSettings, DeviceTier } from '../types';
import { DEFAULT_COMPLETION_SETTINGS, DEFAULT_SYSTEM_PROMPT } from '../utils/constants';

interface SettingsState extends AppSettings {
  setDeviceTier: (tier: DeviceTier) => void;
  setTierOverride: (override: boolean) => void;
  setSystemPrompt: (prompt: string) => void;
  setCompletionSettings: (settings: Partial<CompletionSettings>) => void;
  setDarkMode: (darkMode: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setEnableThinking: (enabled: boolean) => void;
  setTTSVoiceId: (voiceId: string) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  deviceTier: null,
  tierOverride: false,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  completionSettings: DEFAULT_COMPLETION_SETTINGS,
  darkMode: true,
  onboardingComplete: false,
  enableThinking: true,
  ttsVoiceId: 'af_bella',

  setDeviceTier: (tier) => set({ deviceTier: tier }),
  setTierOverride: (override) => set({ tierOverride: override }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  setCompletionSettings: (settings) =>
    set((state) => ({
      completionSettings: { ...state.completionSettings, ...settings },
    })),
  setDarkMode: (darkMode) => set({ darkMode }),
  setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
  setEnableThinking: (enableThinking) => set({ enableThinking }),
  setTTSVoiceId: (ttsVoiceId) => set({ ttsVoiceId }),
  resetToDefaults: () =>
    set({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      completionSettings: DEFAULT_COMPLETION_SETTINGS,
      tierOverride: false,
      darkMode: true,
      enableThinking: true,
      ttsVoiceId: 'af_bella',
    }),
}));
