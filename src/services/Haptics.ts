import { Platform } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

let ReactNativeHapticFeedback: any = null;
try {
  // Optional: only available if user installs
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
} catch {
  ReactNativeHapticFeedback = null;
}

const triggerNative = (type: string) => {
  if (!ReactNativeHapticFeedback) return;
  try {
    ReactNativeHapticFeedback.trigger(type, { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
  } catch {
    // ignore
  }
};

const noop = () => {};

const Haptics = {
  light: () => triggerNative('impactLight'),
  medium: () => triggerNative('impactMedium'),
  heavy: () => triggerNative('impactHeavy'),
  selection: () => triggerNative('selection'),
  success: () => triggerNative('notificationSuccess'),
  warning: () => triggerNative('notificationWarning'),
  error: () => triggerNative('notificationError'),
};

export const useHaptics = () => {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled ?? true);

  if (!hapticsEnabled || !ReactNativeHapticFeedback) {
    return {
      light: noop,
      medium: noop,
      heavy: noop,
      selection: noop,
      success: noop,
      warning: noop,
      error: noop,
      enabled: false,
    };
  }

  return {
    ...Haptics,
    enabled: true,
  };
};

export { Haptics };
export const HAPTICS_AVAILABLE = !!ReactNativeHapticFeedback;
export const HAPTICS_PLATFORM_OK = Platform.OS === 'ios' || Platform.OS === 'android';
