import { useMemo } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS } from '../theme';

export const useTheme = () => {
  const { darkMode } = useSettingsStore();
  
  return useMemo(() => ({
    colors: darkMode ? COLORS.dark : COLORS.light,
    isDark: darkMode,
  }), [darkMode]);
};