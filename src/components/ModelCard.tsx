import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ModelInfo } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { TierBadge } from './TierBadge';

interface ModelCardProps {
  model: ModelInfo;
  onLoad?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  darkMode: boolean;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onLoad,
  onDownload,
  onDelete,
  darkMode,
}) => {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth > 600 ? 300 : screenWidth - SPACING.md * 2;

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
        SHADOWS.md,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {model.name}
          </Text>
          <TierBadge tier={model.tier} size="small" />
        </View>
        <Icon name={getStatusIcon()} size={24} color={getStatusColor()} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="hardware-chip-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {model.params}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="cube-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {model.quantization}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="download-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {model.sizeMB} MB
          </Text>
        </View>
      </View>

      {model.downloadStatus === 'downloading' && model.downloadProgress !== undefined && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${model.downloadProgress}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {model.downloadProgress.toFixed(0)}%
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {model.downloadStatus === 'downloaded' && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={onLoad}
            >
              <Text style={styles.buttonText}>Load</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.error }]}
              onPress={onDelete}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
        {model.downloadStatus === 'not_downloaded' && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onDownload}
          >
            <Text style={styles.buttonText}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    margin: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  details: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.sm,
  },
  progressContainer: {
    height: 20,
    backgroundColor: COLORS.light.surfaceVariant,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    justifyContent: 'center',
  },
  progressBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
