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
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Icon name="alert-circle-outline" size={20} color={colors.warning} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          No model loaded
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.leftSection}>
        <Icon name="cube-outline" size={20} color={colors.primary} />
        <Text style={[styles.modelName, { color: colors.text }]} numberOfLines={1}>
          {activeModel.name}
        </Text>
      </View>
      {lastStats && (
        <View style={styles.rightSection}>
          <Text style={[styles.stat, { color: colors.textSecondary }]}>
            {lastStats.tokensPerSecond.toFixed(1)} tok/s
          </Text>
          <Text style={[styles.stat, { color: colors.textSecondary }]}>
            {lastStats.totalTokens} tokens
          </Text>
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
    borderBottomColor: COLORS.light.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modelName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    fontSize: FONT_SIZES.xs,
    marginLeft: SPACING.md,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
  },
});
