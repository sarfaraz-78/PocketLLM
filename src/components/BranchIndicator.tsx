import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme/tokens';

interface BranchIndicatorProps {
  branchIndex: number;
  totalBranches: number;
  onPrev: () => void;
  onNext: () => void;
  onShowAll?: () => void;
}

const BranchIndicatorBase: React.FC<BranchIndicatorProps> = ({
  branchIndex,
  totalBranches,
  onPrev,
  onNext,
  onShowAll,
}) => {
  const { colors } = useTheme();

  if (totalBranches <= 1) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        onPress={onPrev}
        disabled={branchIndex === 0}
        hitSlop={8}
        style={styles.btn}
      >
        <Icon
          name="chevron-up"
          size={14}
          color={branchIndex === 0 ? colors.textTertiary : colors.primary}
        />
      </TouchableOpacity>
      <View style={styles.center}>
        <Icon name="git-branch-outline" size={10} color={colors.textSecondary} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          {branchIndex + 1}/{totalBranches}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onNext}
        disabled={branchIndex === totalBranches - 1}
        hitSlop={8}
        style={styles.btn}
      >
        <Icon
          name="chevron-down"
          size={14}
          color={branchIndex === totalBranches - 1 ? colors.textTertiary : colors.primary}
        />
      </TouchableOpacity>
      {onShowAll && (
        <TouchableOpacity onPress={onShowAll} hitSlop={8} style={styles.btn}>
          <Icon name="list" size={12} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const BranchIndicator = React.memo(BranchIndicatorBase);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  btn: {
    padding: 4,
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
