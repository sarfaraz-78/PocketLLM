import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ModelInfo } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { TierBadge } from './TierBadge';
import { formatSize } from '../utils/sizeUtils';

interface ModelCardProps {
  model: ModelInfo;
  isActive?: boolean;
  isLoading?: boolean;
  onLoad?: () => void;
  onUnload?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  darkMode: boolean;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isActive,
  isLoading,
  onLoad,
  onUnload,
  onDownload,
  onDelete,
  onRetry,
  onCancel,
  darkMode,
}) => {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth > 600 ? 280 : screenWidth - SPACING.lg * 2;

  const getStatusIcon = () => {
    switch (model.downloadStatus) {
      case 'downloaded':
        return 'checkmark-circle';
      case 'downloading':
        return 'cloud-download';
      case 'error':
        return 'alert-circle';
      default:
        return 'cloud-outline';
    }
  };

  const getStatusColor = () => {
    switch (model.downloadStatus) {
      case 'downloaded':
        return colors.success;
      case 'downloading':
        return colors.info;
      case 'error':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, width: cardWidth },
        SHADOWS.sm,
      ]}
    >
      <View>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {model.name}
            </Text>
            <View style={styles.metaRow}>
              <TierBadge tier={model.tier} size="small" />
              {model.params && model.params !== 'Unknown' && (
                <View style={[styles.paramsBadge, { backgroundColor: colors.primary + '10' }]}>
                  <Text style={[styles.paramsBadgeText, { color: colors.primary }]}>
                    {model.params}
                  </Text>
                </View>
              )}
              {isActive && (
                <View style={[styles.activeBadge, { backgroundColor: colors.success + '14' }]}>
                  <Icon name="radio-button-on" size={10} color={colors.success} />
                  <Text style={[styles.activeBadgeText, { color: colors.success }]}>Active</Text>
                </View>
              )}
              {model.isMultimodal && (
                <View style={[styles.activeBadge, { backgroundColor: colors.primary + '14' }]}>
                  <Icon name="eye" size={10} color={colors.primary} />
                  <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Vision</Text>
                </View>
              )}
              {model.mmprojPath && (
                <View style={[styles.activeBadge, { backgroundColor: colors.info + '14' }]}>
                  <Icon name="camera" size={10} color={colors.info} />
                  <Text style={[styles.activeBadgeText, { color: colors.info }]}>+Proj</Text>
                </View>
              )}
            </View>
          </View>
          <Icon name={getStatusIcon()} size={22} color={getStatusColor()} />
        </View>

        <View style={styles.details}>
          {model.params && model.params !== 'Unknown' && (
            <View style={styles.detailRow}>
              <Icon name="hardware-chip-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {model.params} params
              </Text>
            </View>
          )}
          {model.quantization && model.quantization !== 'unknown' && (
            <View style={styles.detailRow}>
              <Icon name="layers-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {model.availableQuants && model.availableQuants.length > 1
                  ? `${model.availableQuants.length} variants`
                  : model.quantization}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Icon name="download-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatSize(model.sizeMB)}
            </Text>
          </View>
        </View>

        {/* Model Specs from GGUF metadata */}
        {model.specs && (
          <View style={[styles.specsBox, { backgroundColor: colors.background + '60', borderColor: colors.border + '40' }]}>
            <View style={styles.specsGrid}>
              {model.specs.layerCount !== undefined && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textTertiary }]}>Layers</Text>
                  <Text style={[styles.specValue, { color: colors.text }]}>{model.specs.layerCount}</Text>
                </View>
              )}
              {model.specs.embeddingLength !== undefined && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textTertiary }]}>Dim</Text>
                  <Text style={[styles.specValue, { color: colors.text }]}>{model.specs.embeddingLength}</Text>
                </View>
              )}
              {model.specs.headCount !== undefined && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textTertiary }]}>Heads</Text>
                  <Text style={[styles.specValue, { color: colors.text }]}>{model.specs.headCount}</Text>
                </View>
              )}
              {model.specs.contextSize !== undefined && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textTertiary }]}>Context</Text>
                  <Text style={[styles.specValue, { color: colors.text }]}>{model.specs.contextSize.toLocaleString()}</Text>
                </View>
              )}
              {model.specs.vocabSize !== undefined && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: colors.textTertiary }]}>Vocab</Text>
                  <Text style={[styles.specValue, { color: colors.text }]}>{model.specs.vocabSize.toLocaleString()}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {model.downloadStatus === 'downloading' && model.downloadProgress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${model.downloadProgress}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {model.downloadProgress.toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {model.downloadStatus === 'downloaded' && (
          <>
            {isLoading ? (
              <View style={[styles.loadingBtn, { backgroundColor: colors.info + '15' }]}>
                <ActivityIndicator size="small" color={colors.info} />
                <Text style={[styles.loadingBtnText, { color: colors.info }]}>
                  {isActive ? 'Unloading' : 'Loading'}
                </Text>
              </View>
            ) : isActive ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.warning + '15' }]}
                onPress={onUnload}
                activeOpacity={0.8}
              >
                <Icon name="stop-circle" size={14} color={colors.warning} />
                <Text style={[styles.actionText, { color: colors.warning }]}>Unload</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary + '12' }]}
                onPress={onLoad}
                activeOpacity={0.8}
              >
                <Icon name="play" size={14} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Load</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error + '10' }]}
              onPress={onDelete}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Icon name="trash-outline" size={14} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
        {model.downloadStatus === 'downloading' && (
          <View style={styles.actionRow}>
            <View style={[styles.downloadingBtn, { backgroundColor: colors.primary + '20' }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.downloadingText, { color: colors.primary }]}>Downloading</Text>
            </View>
            {onCancel && (
              <TouchableOpacity
                style={[styles.smallActionBtn, { backgroundColor: colors.error + '12' }]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Icon name="close-outline" size={14} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
        {model.downloadStatus === 'error' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.warning + '15' }]}
              onPress={onRetry}
              activeOpacity={0.85}
            >
              <Icon name="refresh-outline" size={14} color={colors.warning} />
              <Text style={[styles.actionText, { color: colors.warning }]}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallActionBtn, { backgroundColor: colors.error + '12' }]}
              onPress={onDelete}
              activeOpacity={0.8}
            >
              <Icon name="trash-outline" size={14} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        {model.downloadStatus === 'not_downloaded' && (
          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
            onPress={onDownload}
            activeOpacity={0.85}
          >
            <Icon name="download-outline" size={16} color="#FFFFFF" />
            <Text style={styles.downloadText}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    margin: SPACING.sm,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  paramsBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  paramsBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  activeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  details: {
    marginBottom: SPACING.md,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  downloadingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  downloadingText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  loadingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  loadingBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  specsBox: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  specItem: {
    minWidth: 60,
  },
  specLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginBottom: 2,
  },
  specValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  smallActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
