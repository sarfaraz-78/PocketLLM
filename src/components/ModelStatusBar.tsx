import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { GenerationStats, ModelInfo } from '../types';

interface ModelStatusBarProps {
  activeModel: ModelInfo | null;
  lastStats: GenerationStats | null;
  darkMode: boolean;
}

export const ModelStatusBar: React.FC<ModelStatusBarProps> = ({
  activeModel,
  lastStats,
  darkMode,
}) => {
  const colors = darkMode ? COLORS.dark : COLORS.light;

  if (!activeModel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceVariant }]}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          No model loaded
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceVariant }]}>
      <View style={styles.leftSection}>
        <View style={[styles.dot, { backgroundColor: colors.success }]} />
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
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
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
