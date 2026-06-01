import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  AccessibilityRole,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../theme/tokens';
import { useHaptics } from '../services/Haptics';

export interface TabConfig {
  key: string;
  label: string;
  icon: string;
  iconActive: string;
}

interface FloatingTabBarProps {
  tabs: TabConfig[];
  activeKey: string;
  onChange: (key: string) => void;
  bottomInset?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_HEIGHT = 64;
const SIDE_MARGIN = 16;
const MAX_BAR_WIDTH = 720;
const BAR_WIDTH = Math.min(SCREEN_WIDTH - SIDE_MARGIN * 2, MAX_BAR_WIDTH);
const TAB_WIDTH = (BAR_WIDTH - 12) / 5; // 5 tabs. container has paddingHorizontal: 6 each side (12 total)
const TAB_INDICATOR_INSET = 6; // matches container paddingHorizontal so indicator aligns with tabs
const INDICATOR_WIDTH = TAB_WIDTH - 4;

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  tabs,
  activeKey,
  onChange,
  bottomInset = 0,
}) => {
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === activeKey));

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIndex * TAB_WIDTH + TAB_INDICATOR_INSET,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [activeIndex, indicatorX]);

  const handlePress = (key: string) => {
    if (key !== activeKey) {
      haptics.selection();
      onChange(key);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: 24 + bottomInset,
          height: BAR_HEIGHT,
          backgroundColor: isDark
            ? 'rgba(20, 20, 40, 0.85)'
            : 'rgba(255, 255, 255, 0.92)',
          borderColor: colors.glassBorder,
          shadowColor: colors.glow,
        },
      ]}
    >
      {/* Sliding active indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: INDICATOR_WIDTH,
            height: BAR_HEIGHT - 8,
            backgroundColor: isDark
              ? 'rgba(124, 58, 237, 0.30)'
              : 'rgba(99, 102, 241, 0.18)',
            borderColor: colors.glassBorder,
            borderRadius: RADIUS.xl,
            transform: [{ translateX: indicatorX }],
            shadowColor: colors.glow,
          },
        ]}
      />
      {tabs.map((tab) => {
        const focused = tab.key === activeKey;
        const iconName = focused ? tab.iconActive : tab.icon;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handlePress(tab.key)}
            style={styles.tab}
            accessibilityRole={'button' as AccessibilityRole}
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            hitSlop={4}
          >
            <Icon
              name={iconName}
              size={22}
              color={focused ? colors.primaryLight : colors.textTertiary}
            />
            <Text
              style={[
                styles.label,
                {
                  color: focused ? colors.text : colors.textTertiary,
                  fontWeight: focused ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xxxl,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    left: 0,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  tab: {
    width: TAB_WIDTH,
    height: BAR_HEIGHT - 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});
