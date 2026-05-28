import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelStore } from '../store/useModelStore';
import { ModelCard } from '../components/ModelCard';
import { TierBadge } from '../components/TierBadge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { getModelsForTier } from '../utils/modelRecommendations';
import { ModelFileManager } from '../services/ModelFileManager';
import { llamaEngine } from '../inference/LlamaEngine';
import { ModelInfo } from '../types';

export const ModelListScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { deviceTier, darkMode } = useSettingsStore();
  const { downloadedModels, activeModel, setActiveModel, addDownloadedModel, removeDownloadedModel } =
    useModelStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const recommendedModels = deviceTier ? getModelsForTier(deviceTier) : [];

  useEffect(() => {
    loadLocalModels();
  }, []);

  const loadLocalModels = async () => {
    try {
      const localModels = await ModelFileManager.listLocalModels();
      localModels.forEach((model) => {
        if (!downloadedModels.find((m) => m.id === model.id)) {
          addDownloadedModel(model);
        }
      });
    } catch (error) {
      console.error('Error loading local models:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLocalModels();
    setRefreshing(false);
  };

  const handleDownload = async (model: ModelInfo) => {
    Alert.alert(
      'Download Model',
      `Download ${model.name} (${model.sizeMB} MB)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              const localPath = await ModelFileManager.downloadModel(
                model,
                (progress) => {
                  console.log(`Download progress: ${progress}%`);
                }
              );
              const downloadedModel = {
                ...model,
                localPath,
                downloadStatus: 'downloaded' as const,
              };
              addDownloadedModel(downloadedModel);
              Alert.alert('Success', 'Model downloaded successfully!');
            } catch (error) {
              Alert.alert(
                'Download Failed',
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          },
        },
      ]
    );
  };

  const handleLoad = async (model: ModelInfo) => {
    if (!model.localPath) {
      Alert.alert('Error', 'Model path not found');
      return;
    }

    try {
      Alert.alert('Loading Model', `Loading ${model.name}...`);
      await llamaEngine.loadModel(model.localPath, deviceTier!);
      setActiveModel(model);
      Alert.alert('Success', 'Model loaded successfully!');
    } catch (error) {
      Alert.alert(
        'Load Failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleDelete = (model: ModelInfo) => {
    Alert.alert(
      'Delete Model',
      `Delete ${model.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (model.localPath) {
                await ModelFileManager.deleteModel(model.localPath);
              }
              if (activeModel?.id === model.id) {
                await llamaEngine.release();
                setActiveModel(null);
              }
              removeDownloadedModel(model.id);
              Alert.alert('Success', 'Model deleted');
            } catch (error) {
              Alert.alert(
                'Delete Failed',
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {deviceTier && (
        <View style={styles.tierSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Device Tier
          </Text>
          <TierBadge tier={deviceTier} size="large" />
        </View>
      )}

      {downloadedModels.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Downloaded Models
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {downloadedModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onLoad={() => handleLoad(model)}
                onDelete={() => handleDelete(model)}
                darkMode={darkMode}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recommended for You
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recommendedModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onDownload={() => handleDownload(model)}
              onLoad={() => handleLoad(model)}
              onDelete={() => handleDelete(model)}
              darkMode={darkMode}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.infoCard}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          About Model Tiers
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Models are recommended based on your device's RAM and capabilities.
          Lower tier models run faster but may be less capable. You can always
          try different models to find what works best for you.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  tierSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  infoCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.light.surfaceVariant,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
});
