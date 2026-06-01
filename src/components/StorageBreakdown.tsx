import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { ModelInfo } from '../types';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme/tokens';

interface StorageBreakdownProps {
  models: ModelInfo[];
}

interface Segment {
  label: string;
  sizeMB: number;
  color: string;
}

const StorageBreakdownBase: React.FC<StorageBreakdownProps> = ({ models }) => {
  const { colors } = useTheme();

  const { segments, totalMB, unallocatedMB } = useMemo(() => {
    const downloaded = models.filter((m) => m.downloadStatus === 'downloaded');
    const total = downloaded.reduce((sum, m) => sum + m.sizeMB, 0);
    const byQuant: Record<string, number> = {};
    for (const m of downloaded) {
      byQuant[m.quantization] = (byQuant[m.quantization] || 0) + m.sizeMB;
    }
    const palette = [colors.primary, colors.secondary || '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];
    const segs: Segment[] = Object.entries(byQuant)
      .map(([label, sizeMB], i) => ({
        label,
        sizeMB,
        color: palette[i % palette.length],
      }))
      .sort((a, b) => b.sizeMB - a.sizeMB);

    return { segments: segs, totalMB: total, unallocatedMB: 0 };
  }, [models]);

  if (segments.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          No models downloaded yet
        </Text>
      </View>
    );
  }

  const fmtSize = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Storage</Text>
        <Text style={[styles.total, { color: colors.primary }]}>{fmtSize(totalMB)}</Text>
      </View>

      <View style={[styles.barWrap, { backgroundColor: colors.background }]}>
        {segments.map((seg) => (
          <View
            key={seg.label}
            style={{
              flex: seg.sizeMB,
              backgroundColor: seg.color,
            }}
          />
        ))}
      </View>

      <View style={styles.legend}>
        {segments.map((seg) => {
          const pct = (seg.sizeMB / totalMB) * 100;
          return (
            <View key={seg.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: seg.color }]} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {seg.label}
              </Text>
              <View style={styles.spacer} />
              <Text style={[styles.value, { color: colors.text }]}>
                {fmtSize(seg.sizeMB)} · {pct.toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const StorageBreakdown = React.memo(StorageBreakdownBase);

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  empty: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  total: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  barWrap: {
    flexDirection: 'row',
    height: 8,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  legend: {
    gap: SPACING.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  spacer: {
    flex: 1,
  },
  value: {
    fontSize: FONT_SIZES.xs,
  },
});
