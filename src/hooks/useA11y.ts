import { Platform, AccessibilityRole, AccessibilityState } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

export const useA11y = () => {
  const highContrast = useSettingsStore((s) => s.highContrastMode ?? false);
  const fontScale = useSettingsStore((s) => s.fontScale ?? 1.0);

  const scaled = (size: number) => Math.round(size * fontScale);

  return {
    highContrast,
    fontScale,
    scaled,
    props: (
      label: string,
      role: AccessibilityRole = 'button',
      state?: AccessibilityState
    ) => ({
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: role,
      accessibilityState: state,
      ...(Platform.OS === 'ios' ? { accessibilityElementsHidden: false } : { importantForAccessibility: 'auto' as const }),
    }),
  };
};

export const contrastText = (bg: string): string => {
  const hex = bg.replace('#', '');
  if (hex.length !== 6) return '#000';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000' : '#fff';
};
