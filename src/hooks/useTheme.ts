import { useMemo } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { getThemeColors, ThemeName, ThemeColors } from '../theme/tokens';

export const useTheme = (): {
  colors: ThemeColors;
  themeName: ThemeName;
  isDark: boolean;
} => {
  const { themeVariant, darkMode } = useSettingsStore();

  return useMemo(() => {
    const themeName: ThemeName = themeVariant || (darkMode ? 'midnight' : 'aurora');
    return {
      colors: getThemeColors(themeName),
      themeName,
      isDark: darkMode,
    };
  }, [themeVariant, darkMode]);
};
