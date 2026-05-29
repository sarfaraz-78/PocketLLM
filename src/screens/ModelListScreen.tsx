import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelStore } from '../store/useModelStore';
import { formatSize, estimateRAM } from '../utils/sizeUtils';
import { ModelCard } from '../components/ModelCard';
import { TierBadge } from '../components/TierBadge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { getModelsForTier } from '../utils/modelRecommendations';
import { ModelFileManager } from '../services/ModelFileManager';
import { llamaEngine, extractModelSpecs } from '../inference/LlamaEngine';
import { HuggingFaceApi } from '../services/HuggingFaceApi';
import { ModelInfo, DeviceTier } from '../types';
import { extractParams } from '../utils/paramUtils';

const extractQuantLabel = (fileName: string): string => {
  const match = fileName.match(
    /(UD-[A-Z0-9]+(?:_[A-Z0-9]+)*|IQ\d+(?:_[A-Z0-9]+)*|Q\d+(?:_[A-Z0-9]+)*|FP16|BF16|F16|F32)/i
  );
  return match ? match[1].toUpperCase() : 'unknown';
};

const QUANT_ORDER = ['Q2_K', 'Q3_K_S', 'Q3_K_M', 'Q3_K_L', 'Q4_0', 'Q4_K_S', 'Q4_K_M', 'Q5_0', 'Q5_K_S', 'Q5_K_M', 'Q6_K', 'Q8_0', 'F16', 'FP16', 'BF16', 'F32'];

const getRecommendedQuant = (
  quants: Array<{ fileName: string; sizeMB: number; quantLabel: string }>,
  tier: DeviceTier | null
): typeof quants[0] | null => {
  if (!quants.length) return null;
  if (quants.length === 1) return quants[0];

  const prefs: Record<DeviceTier, string[]> = {
    [DeviceTier.ULTRA_LOW]: ['Q2_K', 'Q3_K_S', 'Q4_0', 'Q4_K_S', 'IQ2_XXS', 'IQ2_XS', 'IQ3_XXS'],
    [DeviceTier.LOW]: ['Q4_0', 'Q4_K_S', 'Q4_K_M', 'Q5_K_S', 'IQ3_S', 'IQ3_XS', 'IQ3_M'],
    [DeviceTier.MEDIUM]: ['Q4_K_M', 'Q5_K_S', 'Q5_K_M', 'Q4_0', 'IQ4_NL', 'IQ4_XS'],
    [DeviceTier.HIGH]: ['Q5_K_M', 'Q6_K', 'Q4_K_M', 'Q5_0', 'Q8_0', 'F16'],
    [DeviceTier.PREMIUM]: ['Q6_K', 'Q8_0', 'Q5_K_M', 'FP16', 'BF16', 'F16', 'F32'],
  };

  const tierPrefs = tier ? prefs[tier] : prefs[DeviceTier.MEDIUM];
  for (const pref of tierPrefs) {
    const match = quants.find((q) => q.quantLabel.toUpperCase().includes(pref));
    if (match) return match;
  }

  // fallback to middle-sized quant
  const sorted = [...quants].sort((a, b) => a.sizeMB - b.sizeMB);
  return sorted[Math.floor(sorted.length / 2)];
};

export const ModelListScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModelInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [quantPickerVisible, setQuantPickerVisible] = useState(false);
  const [pendingModel, setPendingModel] = useState<ModelInfo | null>(null);

  const { deviceTier, darkMode } = useSettingsStore();
  const { downloadedModels, activeModel, setActiveModel, addDownloadedModel, removeDownloadedModel, updateModelProgress, setModelStatus, loadingModelId, setLoadingModelId } =
    useModelStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  // Merge search results with downloaded models so downloading state is visible
  const mergedSearchResults = searchResults.map((model) => {
    const dl = downloadedModels.find((m) => m.id === model.id);
    return dl || model;
  });

  const recommendedModels = deviceTier ? getModelsForTier(deviceTier) : [];

  useEffect(() => {
    loadLocalModels();

    // Listen for background download status changes
    const unsubscribe = ModelFileManager.onDownloadStatusChange((tasks) => {
      for (const task of tasks) {
        if (task.status === 'downloading' || task.status === 'pending' || task.status === 'paused') {
          updateModelProgress(task.modelId, task.progress);
        } else if (task.status === 'completed') {
          handleDownloadComplete(task.modelId, task.localPath || '');
        } else if (task.status === 'failed') {
          setModelStatus(task.modelId, 'error');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDownloadComplete = async (modelId: string, localPath: string) => {
    const model = downloadedModels.find((m) => m.id === modelId);
    if (!model) return;

    let specs: ModelInfo['specs'] = undefined;
    try {
      specs = await extractModelSpecs(localPath);
    } catch (e) {
      console.warn('[Download] Could not extract specs:', e);
    }

    addDownloadedModel({
      ...model,
      localPath,
      downloadStatus: 'downloaded',
      downloadProgress: 100,
      specs,
    });
  };

  const loadLocalModels = async () => {
    try {
      const localModels = await ModelFileManager.listLocalModels();
      for (const model of localModels) {
        if (!downloadedModels.find((m) => m.id === model.id)) {
          // Try to read specs for existing local models
          if (model.localPath) {
            try {
              const specs = await extractModelSpecs(model.localPath);
              if (specs) {
                (model as any).specs = specs;
              }
            } catch (e) {
              // ignore
            }
          }
          addDownloadedModel(model);
        }
      }

      // Fix existing models with Unknown params by re-extracting from name
      downloadedModels.forEach((m) => {
        if (m.params === 'Unknown' && m.name) {
          const extracted = extractParams(m.name);
          if (extracted !== 'Unknown') {
            addDownloadedModel({ ...m, params: extracted });
          }
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const hfModels = await HuggingFaceApi.searchModels(searchQuery, 15);

      // Fetch tree API sequentially to avoid rate limits
      const modelsWithSizes: ModelInfo[] = [];
      for (const m of hfModels) {
        const modelId = m.id || m.modelId || '';
        if (!modelId) continue;

        let ggufFiles: Array<{ fileName: string; sizeMB: number }> = [];

        try {
          const treeFiles = await HuggingFaceApi.getModelTree(modelId);
          ggufFiles = treeFiles.map((f) => ({
            fileName: f.path,
            sizeMB: Math.round(f.size / (1024 * 1024)),
          }));
        } catch {
          // fallback to siblings from search (may include sizes)
          const siblings = m.siblings || [];
          ggufFiles = siblings
            .filter((s) => s.rfilename.toLowerCase().endsWith('.gguf'))
            .map((f) => ({
              fileName: f.rfilename,
              sizeMB: f.size ? Math.round(f.size / (1024 * 1024)) : 0,
            }));
        }

        if (ggufFiles.length === 0) continue;

        // Try HEAD request for files with unknown size (up to 3 per model to avoid rate limits)
        const filesNeedingSize = ggufFiles.filter((f) => f.sizeMB === 0).slice(0, 3);
        for (const f of filesNeedingSize) {
          try {
            const bytes = await HuggingFaceApi.getFileSizeFromHead(modelId, f.fileName);
            if (bytes > 0) {
              f.sizeMB = Math.round(bytes / (1024 * 1024));
            }
          } catch {
            // ignore HEAD failures
          }
        }

        const availableQuants = ggufFiles.map((f) => ({
          fileName: f.fileName,
          sizeMB: f.sizeMB,
          quantLabel: extractQuantLabel(f.fileName),
        }));

        const firstFile = availableQuants[0];
        const params = extractParams(modelId);

        modelsWithSizes.push({
          id: `hf-${modelId.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: modelId.split('/').pop() || modelId,
          repoId: modelId,
          fileName: firstFile.fileName,
          downloadUrl: HuggingFaceApi.getDownloadUrl(modelId, firstFile.fileName),
          sizeMB: firstFile.sizeMB,
          quantization: firstFile.quantLabel,
          params,
          architecture: m.tags?.find((t) => t.startsWith('transformers'))
            ? 'Transformer'
            : 'Unknown',
          tier:
            firstFile.sizeMB > 4000
              ? DeviceTier.HIGH
              : firstFile.sizeMB > 1500
                ? DeviceTier.MEDIUM
                : DeviceTier.LOW,
          downloadStatus: 'not_downloaded' as const,
          availableQuants,
        });

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      setSearchResults(modelsWithSizes);
    } catch (error) {
      Alert.alert('Search Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSearching(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS' as any,
          {
            title: 'Download Notifications',
            message: 'PocketLLM needs notification permission to show download progress.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const handleDownload = async (model: ModelInfo) => {
    if (model.availableQuants && model.availableQuants.length > 1) {
      setPendingModel(model);
      setQuantPickerVisible(true);
      return;
    }
    await doDownload(model);
  };

  const doDownload = async (model: ModelInfo) => {
    Alert.alert(
      'Download Model',
      `Download ${model.name} (${(model.sizeMB / 1024).toFixed(1)} GB)?\n\nThis will download in the background. You can close the app and the download will continue.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            await requestNotificationPermission();

            // Add to store as downloading
            const downloadingModel = {
              ...model,
              downloadStatus: 'downloading' as const,
              downloadProgress: 0,
            };
            addDownloadedModel(downloadingModel);

            try {
              // Start background download - returns immediately, continues in background
              await ModelFileManager.downloadModel(
                model,
                (progress) => {
                  updateModelProgress(model.id, progress);
                }
              );

              // Download started - it will continue in background
              // Completion is handled by the status change listener
            } catch (error) {
              addDownloadedModel({
                ...model,
                downloadStatus: 'error' as const,
              });
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

  const selectQuantAndDownload = (quant: { fileName: string; sizeMB: number; quantLabel: string }) => {
    if (!pendingModel) return;
    setQuantPickerVisible(false);

    const modelToDownload: ModelInfo = {
      ...pendingModel,
      fileName: quant.fileName,
      downloadUrl: HuggingFaceApi.getDownloadUrl(pendingModel.repoId, quant.fileName),
      sizeMB: quant.sizeMB,
      quantization: quant.quantLabel,
      availableQuants: undefined,
    };

    doDownload(modelToDownload);
  };

  const handleLoad = async (model: ModelInfo) => {
    if (!model.localPath) {
      Alert.alert('Error', 'Model path not found');
      return;
    }

    setLoadingModelId(model.id);

    try {
      await llamaEngine.loadModel(model.localPath, deviceTier!, model.mmprojPath);
      setActiveModel(model);
      Alert.alert('Success', `${model.name} loaded!`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Load Failed',
        msg + '\n\nTip: On 32-bit devices, try a smaller model (0.5B - 1.5B) with Q4_K_M or lower quantization.'
      );
    } finally {
      setLoadingModelId(null);
    }
  };

  const handleUnload = async () => {
    setLoadingModelId(activeModel?.id || 'unload');
    try {
      await llamaEngine.release();
      setActiveModel(null);
    } catch (error) {
      console.error('Unload error:', error);
    } finally {
      setLoadingModelId(null);
    }
  };

  const handleDelete = (model: ModelInfo) => {
    Alert.alert(
      'Delete Model',
      `Delete ${model.name}?`,
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
            } catch (error) {
              Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Unknown');
            }
          },
        },
      ]
    );
  };

  const handleRetry = async (model: ModelInfo) => {
    addDownloadedModel({
      ...model,
      downloadStatus: 'downloading',
      downloadProgress: 0,
    });
    try {
      await ModelFileManager.retryDownload(model.id, (progress) => {
        updateModelProgress(model.id, progress);
      });
    } catch (error) {
      addDownloadedModel({
        ...model,
        downloadStatus: 'error',
      });
      Alert.alert(
        'Retry Failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleCancel = async (model: ModelInfo) => {
    try {
      await ModelFileManager.cancelDownload(model.id);
      removeDownloadedModel(model.id);
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Models</Text>
        {activeModel && (
          <View style={[styles.activePill, { backgroundColor: colors.success + '14' }]}>
            <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.activeText, { color: colors.success }]}>Active</Text>
          </View>
        )}
      </View>

      {/* HuggingFace Search */}
      <View style={[styles.searchCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <Text style={[styles.searchLabel, { color: colors.textSecondary }]}>
          <Icon name="globe-outline" size={14} /> Search HuggingFace
        </Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.searchInput,
              { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Search models (e.g. llama, qwen, phi)"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.searchBtn, { backgroundColor: colors.primary }]}
            onPress={handleSearch}
            activeOpacity={0.85}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="search" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results */}
      {hasSearched && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Search Results
          </Text>
          {isSearching ? (
            <View style={styles.searchingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.searchingText, { color: colors.textSecondary }]}>
                Searching HuggingFace...
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <Text style={[styles.noResults, { color: colors.textSecondary }]}>
              No GGUF models found. Try a different query.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mergedSearchResults.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isActive={activeModel?.id === model.id}
                  isLoading={loadingModelId === model.id}
                  onDownload={() => handleDownload(model)}
                  onLoad={() => handleLoad(model)}
                  onUnload={handleUnload}
                  onDelete={() => handleDelete(model)}
                  onRetry={() => handleRetry(model)}
                  onCancel={() => handleCancel(model)}
                  darkMode={darkMode}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {deviceTier && (
        <View style={[styles.tierCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Your Device
          </Text>
          <View style={styles.tierRow}>
            <TierBadge tier={deviceTier} size="medium" />
            <Text style={[styles.tierDesc, { color: colors.textSecondary }]}>
              Models optimized for your hardware
            </Text>
          </View>
        </View>
      )}

      {downloadedModels.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Downloaded
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {downloadedModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isActive={activeModel?.id === model.id}
                isLoading={loadingModelId === model.id}
                onLoad={() => handleLoad(model)}
                onUnload={handleUnload}
                onDelete={() => handleDelete(model)}
                onRetry={() => handleRetry(model)}
                onCancel={() => handleCancel(model)}
                darkMode={darkMode}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recommended
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recommendedModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isActive={activeModel?.id === model.id}
              isLoading={loadingModelId === model.id}
              onDownload={() => handleDownload(model)}
              onLoad={() => handleLoad(model)}
              onUnload={handleUnload}
              onDelete={() => handleDelete(model)}
              onRetry={() => handleRetry(model)}
              onCancel={() => handleCancel(model)}
              darkMode={darkMode}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <Icon name="information-circle-outline" size={20} color={colors.textTertiary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Models are recommended based on your device RAM. Lower tier = faster but less capable.
          You can also import any GGUF file from storage.
        </Text>
      </View>

      {/* Quantization Picker Modal */}
      <Modal
        visible={quantPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuantPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Choose Quantization
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {pendingModel?.name}
            </Text>
            {pendingModel?.params && pendingModel.params !== 'Unknown' && (
              <View style={[styles.paramsBadge, { backgroundColor: colors.primary + '10' }]}>
                <Icon name="hardware-chip-outline" size={12} color={colors.primary} />
                <Text style={[styles.paramsBadgeText, { color: colors.primary }]}>
                  {pendingModel.params} parameters
                </Text>
              </View>
            )}

            <ScrollView style={styles.quantList} showsVerticalScrollIndicator={false}>
              {/* Recommended option */}
              {(() => {
                const rec = getRecommendedQuant(pendingModel?.availableQuants || [], deviceTier);
                if (!rec) return null;
                return (
                  <TouchableOpacity
                    style={[styles.quantOption, { borderBottomColor: colors.border }]}
                    onPress={() => selectQuantAndDownload(rec)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quantOptionLeft}>
                      <View style={[styles.quantBadge, { backgroundColor: colors.success + '14' }]}>
                        <Text style={[styles.quantBadgeText, { color: colors.success }]}>
                          {rec.quantLabel}
                        </Text>
                      </View>
                      <View style={styles.recommendedLabel}>
                        <Icon name="star" size={12} color={colors.success} />
                        <Text style={[styles.recommendedText, { color: colors.success }]}>
                          Recommended
                        </Text>
                      </View>
                      <View style={[styles.sizeBadge, { backgroundColor: colors.success + '10' }]}>
                        <Text style={[styles.sizeBadgeText, { color: colors.success }]}>
                          {formatSize(rec.sizeMB)}
                        </Text>
                      </View>
                      <View style={[styles.ramBadge, { backgroundColor: colors.info + '10' }]}>
                        <Icon name="hardware-chip-outline" size={10} color={colors.info} />
                        <Text style={[styles.ramBadgeText, { color: colors.info }]}>
                          ~{estimateRAM(rec.sizeMB)} RAM
                        </Text>
                      </View>
                    </View>
                    <Icon name="download-outline" size={20} color={colors.success} />
                  </TouchableOpacity>
                );
              })()}

              {/* Divider between recommended and all options */}
              {(() => {
                const rec = getRecommendedQuant(pendingModel?.availableQuants || [], deviceTier);
                if (!rec || (pendingModel?.availableQuants?.length || 0) <= 1) return null;
                return (
                  <View style={[styles.quantDivider, { backgroundColor: colors.border }]}>
                    <Text style={[styles.quantDividerText, { color: colors.textTertiary }]}>
                      All variants
                    </Text>
                  </View>
                );
              })()}

              {(() => {
                const rec = getRecommendedQuant(pendingModel?.availableQuants || [], deviceTier);
                return (pendingModel?.availableQuants || []).map((quant) => (
                  <TouchableOpacity
                    key={quant.fileName}
                    style={[
                      styles.quantOption,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => selectQuantAndDownload(quant)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quantOptionLeft}>
                      <View
                        style={[
                          styles.quantBadge,
                          { backgroundColor: colors.primary + '12' },
                        ]}
                      >
                        <Text style={[styles.quantBadgeText, { color: colors.primary }]}>
                          {quant.quantLabel}
                        </Text>
                      </View>
                      <View style={[styles.sizeBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.sizeBadgeText, { color: colors.textSecondary }]}>
                          {formatSize(quant.sizeMB)}
                        </Text>
                      </View>
                      <View style={[styles.ramBadge, { backgroundColor: colors.info + '10' }]}>
                        <Icon name="hardware-chip-outline" size={10} color={colors.info} />
                        <Text style={[styles.ramBadgeText, { color: colors.info }]}>
                          ~{estimateRAM(quant.sizeMB)} RAM
                        </Text>
                      </View>
                    </View>
                    <Icon name="download-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>

            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setQuantPickerVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.huge,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  activeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  searchCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  searchLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  tierCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tierDesc: {
    fontSize: FONT_SIZES.sm,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  infoCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.huge,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  quantList: {
    maxHeight: 300,
  },
  quantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  quantOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  quantBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  quantBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  sizeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  sizeBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  recommendedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  paramsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  paramsBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  ramBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  ramBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  quantDivider: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  quantDividerText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
  },
  searchingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  searchingText: {
    fontSize: FONT_SIZES.md,
  },
  cancelBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
