import { create } from 'zustand';
import { AppSettings, CompletionSettings, DeviceTier } from '../types';
import { DEFAULT_COMPLETION_SETTINGS, DEFAULT_SYSTEM_PROMPT } from '../utils/constants';
import { ThemeName } from '../theme/tokens';

export interface PromptTemplate {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  builtin?: boolean;
}

interface SettingsState extends AppSettings {
  themeVariant: ThemeName;
  highContrastMode: boolean;
  customTemplates: PromptTemplate[];
  activeTemplateId: string | null;
  hapticsEnabled: boolean;
  fontScale: number;
  setDeviceTier: (tier: DeviceTier) => void;
  setTierOverride: (override: boolean) => void;
  setSystemPrompt: (prompt: string) => void;
  setCompletionSettings: (settings: Partial<CompletionSettings>) => void;
  setDarkMode: (darkMode: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setEnableThinking: (enabled: boolean) => void;
  setCodingMode: (enabled: boolean) => void;
  setTTSVoiceId: (voiceId: string) => void;
  setTurboQuantEnabled: (enabled: boolean) => void;
  setThemeVariant: (variant: ThemeName) => void;
  setHighContrastMode: (enabled: boolean) => void;
  setCustomTemplates: (templates: PromptTemplate[]) => void;
  addCustomTemplate: (template: PromptTemplate) => void;
  removeCustomTemplate: (id: string) => void;
  setActiveTemplateId: (id: string | null) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setFontScale: (scale: number) => void;
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
  codingMode: false,
  ttsVoiceId: 'af_bella',
  turboQuantEnabled: true,
  themeVariant: 'midnight',
  highContrastMode: false,
  customTemplates: [],
  activeTemplateId: null,
  hapticsEnabled: true,
  fontScale: 1.0,

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
  setCodingMode: (codingMode) => set({ codingMode }),
  setTTSVoiceId: (ttsVoiceId) => set({ ttsVoiceId }),
  setTurboQuantEnabled: (turboQuantEnabled) => set({ turboQuantEnabled }),
  setThemeVariant: (themeVariant) => set({ themeVariant }),
  setHighContrastMode: (highContrastMode) => set({ highContrastMode }),
  setCustomTemplates: (customTemplates) => set({ customTemplates }),
  addCustomTemplate: (template) =>
    set((state) => ({ customTemplates: [...state.customTemplates, template] })),
  removeCustomTemplate: (id) =>
    set((state) => ({ customTemplates: state.customTemplates.filter((t) => t.id !== id) })),
  setActiveTemplateId: (activeTemplateId) => set({ activeTemplateId }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setFontScale: (fontScale) => set({ fontScale }),
  resetToDefaults: () =>
    set({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      completionSettings: DEFAULT_COMPLETION_SETTINGS,
      tierOverride: false,
      darkMode: true,
      enableThinking: true,
      codingMode: false,
      ttsVoiceId: 'af_bella',
      turboQuantEnabled: true,
      themeVariant: 'midnight',
      highContrastMode: false,
      customTemplates: [],
      activeTemplateId: null,
      hapticsEnabled: true,
      fontScale: 1.0,
    }),
}));
