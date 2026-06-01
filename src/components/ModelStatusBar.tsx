import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../theme/tokens';
import { GenerationStats, ModelInfo } from '../types';

interface ModelStatusBarProps {
  activeModel: ModelInfo | null;
  lastStats: GenerationStats | null;
  darkMode?: boolean;
}

export const ModelStatusBar: React.FC<ModelStatusBarProps> = ({
  activeModel,
  lastStats,
  darkMode: _darkMode,
}) => {
  const { colors } = useTheme();

  if (!activeModel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.glassBg, borderBottomColor: colors.glassBorder }]}>
        <View style={[styles.dot, { backgroundColor: colors.warning, shadowColor: colors.warning }]} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          No model loaded
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.glassBg, borderBottomColor: colors.glassBorder }]}>
      <View style={styles.leftSection}>
        <View style={[styles.dot, { backgroundColor: colors.success, shadowColor: colors.success }]} />
        <Text style={[styles.modelName, { color: colors.text }]} numberOfLines={1}>
          {activeModel.name}
        </Text>
      </View>
      {lastStats && (
        <View style={styles.rightSection}>
          <View style={styles.statPill}>
            <Icon name="flash-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.stat, { color: colors.textSecondary }]}>
              {lastStats.tokensPerSecond.toFixed(1)} tok/s
            </Text>
          </View>
          <View style={styles.statPill}>
            <Icon name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.stat, { color: colors.textSecondary }]}>
              {(lastStats.totalTimeMs / 1000).toFixed(1)}s
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  modelName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stat: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});
