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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
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
import { pickFiles } from '../services/NativeFilePicker';

const extractQuantLabel = (fileName: string): string => {
  const match = fileName.match(
    /(UD-[A-Z0-9]+(?:_[A-Z0-9]+)*|IQ\d+(?:_[A-Z0-9]+)*|Q\d+(?:_[A-Z0-9]+)*|FP16|BF16|F16|F32)/i
  );
  return match ? match[1].toUpperCase() : 'unknown';
};

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

  const sorted = [...quants].sort((a, b) => a.sizeMB - b.sizeMB);
  return sorted[Math.floor(sorted.length / 2)];
};

export const ModelListScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModelInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'coding'>('all');

  const [quantPickerVisible, setQuantPickerVisible] = useState(false);
  const [pendingModel, setPendingModel] = useState<ModelInfo | null>(null);

  const { deviceTier, darkMode, turboQuantEnabled } = useSettingsStore();
  const {
    downloadedModels,
    activeModel,
    setActiveModel,
    addDownloadedModel,
    removeDownloadedModel,
    updateModelProgress,
    setModelStatus,
    loadingModelId,
    setLoadingModelId,
    updateModelMmproj,
  } = useModelStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const mergedSearchResults = searchResults.map((model) => {
    const dl = downloadedModels.find((m) => m.id === model.id);
    return dl || model;
  });

  const filteredSearchResults = mergedSearchResults.filter((model) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'low') {
      return model.sizeMB <= 1500 || model.params === '0.5B' || model.params === '1.5B';
    }
    if (activeFilter === 'medium') {
      return model.sizeMB > 1500 && model.sizeMB <= 3500;
    }
    if (activeFilter === 'high') {
      return model.sizeMB > 3500;
    }
    if (activeFilter === 'coding') {
      const id = (model.repoId || model.name || '').toLowerCase();
      return id.includes('code') || id.includes('coder');
    }
    return true;
  });

  const recommendedModels = deviceTier ? getModelsForTier(deviceTier) : [];

  useEffect(() => {
    loadLocalModels();

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
          const siblings = m.siblings || [];
          ggufFiles = siblings
            .filter((s) => s.rfilename.toLowerCase().endsWith('.gguf'))
            .map((f) => ({
              fileName: f.rfilename,
              sizeMB: f.size ? Math.round(f.size / (1024 * 1024)) : 0,
            }));
        }

        if (ggufFiles.length === 0) continue;

        const filesNeedingSize = ggufFiles.filter((f) => f.sizeMB === 0).slice(0, 3);
        for (const f of filesNeedingSize) {
          try {
            const bytes = await HuggingFaceApi.getFileSizeFromHead(modelId, f.fileName);
            if (bytes > 0) {
              f.sizeMB = Math.round(bytes / (1024 * 1024));
            }
          } catch {
            // ignore
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

            const downloadingModel = {
              ...model,
              downloadStatus: 'downloading' as const,
              downloadProgress: 0,
            };
            addDownloadedModel(downloadingModel);

            try {
              await ModelFileManager.downloadModel(
                model,
                (progress) => {
                  updateModelProgress(model.id, progress);
                }
              );
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
        msg + '\n\nTip: Toggle "TurboQuant Engine" in Settings to automatically optimize mlock, GPU thread offloading, and FlashAttention coefficients!'
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

  const isGguf = (name: string) => name.toLowerCase().endsWith('.gguf');

  const handleImportNative = async () => {
    try {
      const picked = await pickFiles();
      if (!picked || picked.length === 0) return;

      const modelDir = await ModelFileManager.getModelDirectory();
      const file = picked[0];
      
      if (!isGguf(file.name)) {
        Alert.alert('Invalid File', 'Please select a valid GGUF (.gguf) model file.');
        return;
      }

      const destPath = `${modelDir}/${file.name}`;
      const fileExists = await RNFS.exists(destPath);
      
      if (!fileExists) {
        try {
          await RNFS.copyFile(file.path, destPath);
        } catch (e) {
          console.warn('Copy file failed:', e);
        }
      }

      const modelName = file.name.replace(/\.gguf$/i, '');
      const stat = await RNFS.stat(destPath).catch(() => ({ size: file.size }));
      
      let specs: ModelInfo['specs'] = undefined;
      try {
        specs = await extractModelSpecs(destPath);
      } catch (e) {
        console.warn('Could not extract specs:', e);
      }

      const importedModel: ModelInfo = {
        id: `local-${file.name}`,
        name: modelName,
        repoId: 'local',
        fileName: file.name,
        downloadUrl: '',
        sizeMB: Math.round(stat.size / (1024 * 1024)) || 1000,
        quantization: extractQuantLabel(file.name),
        params: extractParams(file.name),
        architecture: 'unknown',
        tier: deviceTier || DeviceTier.MEDIUM,
        localPath: destPath,
        downloadStatus: 'downloaded',
        specs,
      };

      addDownloadedModel(importedModel);
      Alert.alert('Import Success', `Successfully added ${modelName} to your local library!`);
      await loadLocalModels();
    } catch (err: any) {
      if (err?.message?.includes('CANCELLED') || err?.code === 'CANCELLED') {
        return;
      }
      Alert.alert('Import Failed', err?.message || 'Could not import the model file.');
    }
  };

  const handleAttachMmproj = async (model: ModelInfo) => {
    try {
      Alert.alert(
        'Attach CLIP Projector',
        'Select a GGUF projector/mmproj file (e.g. mmproj-model-f16.gguf) to pair with this model. This will activate multimodal capabilities such as image and audio input.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pick Projector File',
            onPress: async () => {
              const picked = await pickFiles();
              if (!picked || picked.length === 0) return;

              const file = picked[0];
              if (!file.name.toLowerCase().endsWith('.gguf') && !file.name.toLowerCase().includes('mmproj')) {
                Alert.alert('Invalid Projector', 'Please select a GGUF projector or mmproj file.');
                return;
              }

              const modelDir = await ModelFileManager.getModelDirectory();
              const destPath = `${modelDir}/${file.name}`;
              const fileExists = await RNFS.exists(destPath);
              
              if (!fileExists) {
                try {
                  await RNFS.copyFile(file.path, destPath);
                } catch (e) {
                  console.warn('Copy projector failed:', e);
                }
              }

              updateModelMmproj(model.id, destPath);
              Alert.alert('CLIP Attached', `Successfully paired projector "${file.name}" with your model!`);
              await loadLocalModels();
            }
          },
          ...(model.mmprojPath ? [{
            text: 'Remove Existing Projector',
            style: 'destructive' as const,
            onPress: () => {
              updateModelMmproj(model.id, undefined);
              Alert.alert('CLIP Removed', 'Projector file has been detached.');
            }
          }] : [])
        ]
      );
    } catch (err: any) {
      if (err?.message?.includes('CANCELLED') || err?.code === 'CANCELLED') {
        return;
      }
      Alert.alert('Attachment Failed', err?.message || 'Could not pick projector file.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Modern Fixed Header */}
      <View style={[styles.headerFixed, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitleText, { color: colors.text }]}>Models Manager</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.xs, alignItems: 'center' }}>
            {turboQuantEnabled && (
              <View style={[styles.activePill, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30', borderWidth: 1 }]}>
                <Icon name="flash" size={11} color={colors.primary} />
                <Text style={[styles.activeText, { color: colors.primary }]}>TurboQuant ⚡</Text>
              </View>
            )}
            {activeModel && (
              <View style={[styles.activePill, { backgroundColor: colors.success + '14' }]}>
                <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.activeText, { color: colors.success }]}>Active</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Model Indicator Panel */}
        {activeModel && (
          <View style={[styles.activeModelCard, { backgroundColor: colors.surface, borderColor: colors.success + '40' }, SHADOWS.sm]}>
            <View style={styles.activeModelRow}>
              <View style={[styles.activeIconContainer, { backgroundColor: colors.success + '12' }]}>
                <Icon name="cube" size={24} color={colors.success} />
              </View>
              <View style={styles.activeModelDetails}>
                <Text style={[styles.activeModelLabel, { color: colors.success }]}>ACTIVE INFERENCE RUNNING</Text>
                <Text style={[styles.activeModelName, { color: colors.text }]} numberOfLines={1}>{activeModel.name}</Text>
                <Text style={[styles.activeModelSpecs, { color: colors.textSecondary }]}>
                  Size: {formatSize(activeModel.sizeMB * 1024 * 1024)} · Params: {activeModel.params}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.unloadBtn, { backgroundColor: colors.error }]}
                onPress={handleUnload}
                activeOpacity={0.8}
              >
                <Icon name="power" size={16} color="#FFFFFF" />
                <Text style={styles.unloadBtnText}>Unload</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Native OS Import Card */}
        <View style={[styles.importNativeCard, { backgroundColor: colors.surface }, SHADOWS.xs]}>
          <View style={styles.importNativeInfo}>
            <Icon name="cloud-upload-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={[styles.importNativeTitle, { color: colors.text }]}>Import Custom Local GGUF</Text>
              <Text style={[styles.importNativeDesc, { color: colors.textSecondary }]}>
                Instantly pick any .gguf model file using your device's native file explorer.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.importNativeBtn, { backgroundColor: colors.primary }]}
            onPress={handleImportNative}
            activeOpacity={0.8}
          >
            <Icon name="document-attach-outline" size={16} color="#FFFFFF" />
            <Text style={styles.importNativeBtnText}>Pick GGUF File</Text>
          </TouchableOpacity>
        </View>

        {/* Search HuggingFace */}
        <View style={[styles.searchCard, { backgroundColor: colors.surface }, SHADOWS.xs]}>
          <Text style={[styles.searchLabel, { color: colors.textSecondary }]}>
            <Icon name="globe-outline" size={14} /> Search HuggingFace Repo
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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

        {/* Filter Chips */}
        {hasSearched && (
          <View style={[styles.filterChipsCard, { backgroundColor: colors.surface }, SHADOWS.xs]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
              {[
                { key: 'all' as const, label: 'All', icon: 'apps-outline' },
                { key: 'low' as const, label: '0.5B–1.5B', icon: 'leaf-outline' },
                { key: 'medium' as const, label: '2B–3B', icon: 'fitness-outline' },
                { key: 'high' as const, label: '7B+', icon: 'rocket-outline' },
                { key: 'coding' as const, label: 'Coding', icon: 'code-slash-outline' },
              ].map((chip) => {
                const isActive = activeFilter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? colors.primary + '18' : colors.surfaceVariant,
                        borderColor: isActive ? colors.primary + '50' : colors.border,
                      },
                    ]}
                    onPress={() => setActiveFilter(chip.key)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={chip.icon}
                      size={14}
                      color={isActive ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isActive ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Search Results */}
        {hasSearched && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Search Results{activeFilter !== 'all' ? ` (${filteredSearchResults.length})` : ''}
            </Text>
            {isSearching ? (
              <View style={styles.searchingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.searchingText, { color: colors.textSecondary }]}>Searching Hugging Face...</Text>
              </View>
            ) : filteredSearchResults.length === 0 ? (
              <Text style={[styles.noResults, { color: colors.textSecondary }]}>
                {mergedSearchResults.length > 0 ? 'No models match this filter' : 'No GGUF models found'}
              </Text>
            ) : (
              filteredSearchResults.map((model) => (
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
                  onDownload={() => handleDownload(model)}
                  onAttachMmproj={() => handleAttachMmproj(model)}
                  darkMode={darkMode}
                />
              ))
            )}
          </View>
        )}

        {/* Recommended Models */}
        <View style={styles.section}>
          <View style={styles.recommendedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended for You</Text>
            <TierBadge tier={deviceTier} />
          </View>
          {recommendedModels.map((model) => {
            const dl = downloadedModels.find((m) => m.id === model.id);
            const m = dl || model;
            return (
              <ModelCard
                key={m.id}
                model={m}
                isActive={activeModel?.id === m.id}
                isLoading={loadingModelId === m.id}
                onLoad={() => handleLoad(m)}
                onUnload={handleUnload}
                onDelete={() => handleDelete(m)}
                onRetry={() => handleRetry(m)}
                onCancel={() => handleCancel(m)}
                onDownload={() => handleDownload(m)}
                onAttachMmproj={() => handleAttachMmproj(m)}
                darkMode={darkMode}
              />
            );
          })}
        </View>

        {/* Downloaded/Local Models */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Loaded Library</Text>
          {downloadedModels.length === 0 ? (
            <View style={[styles.infoCard, { backgroundColor: colors.surface }, SHADOWS.xs]}>
              <Icon name="information-circle-outline" size={20} color={colors.textTertiary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                No models loaded yet. Search online or import a local GGUF file to begin.
              </Text>
            </View>
          ) : (
            downloadedModels.map((model) => (
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
                onDownload={() => handleDownload(model)}
                onAttachMmproj={() => handleAttachMmproj(model)}
                darkMode={darkMode}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Quantization Modal */}
      <Modal
        visible={quantPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuantPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Quantization</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{pendingModel?.name}</Text>
            {pendingModel?.params && pendingModel.params !== 'Unknown' && (
              <View style={[styles.paramsBadge, { backgroundColor: colors.primary + '10' }]}>
                <Icon name="hardware-chip-outline" size={12} color={colors.primary} />
                <Text style={[styles.paramsBadgeText, { color: colors.primary }]}>{pendingModel.params} parameters</Text>
              </View>
            )}

            <ScrollView style={styles.quantList} showsVerticalScrollIndicator={false}>
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
                        <Text style={[styles.quantBadgeText, { color: colors.success }]}>{rec.quantLabel}</Text>
                      </View>
                      <View style={styles.recommendedLabel}>
                        <Icon name="star" size={12} color={colors.success} />
                        <Text style={[styles.recommendedText, { color: colors.success }]}>Recommended</Text>
                      </View>
                      <View style={[styles.sizeBadge, { backgroundColor: colors.success + '10' }]}>
                        <Text style={[styles.sizeBadgeText, { color: colors.success }]}>{formatSize(rec.sizeMB * 1024 * 1024)}</Text>
                      </View>
                    </View>
                    <Icon name="download-outline" size={20} color={colors.success} />
                  </TouchableOpacity>
                );
              })()}

              {(() => {
                const rec = getRecommendedQuant(pendingModel?.availableQuants || [], deviceTier);
                if (!rec || (pendingModel?.availableQuants?.length || 0) <= 1) return null;
                return (
                  <View style={[styles.quantDivider, { backgroundColor: colors.border }]}>
                    <Text style={[styles.quantDividerText, { color: colors.textTertiary }]}>All variants</Text>
                  </View>
                );
              })()}

              {(() => {
                return (pendingModel?.availableQuants || []).map((quant) => (
                  <TouchableOpacity
                    key={quant.fileName}
                    style={[styles.quantOption, { borderBottomColor: colors.border }]}
                    onPress={() => selectQuantAndDownload(quant)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quantOptionLeft}>
                      <View style={[styles.quantBadge, { backgroundColor: colors.primary + '12' }]}>
                        <Text style={[styles.quantBadgeText, { color: colors.primary }]}>{quant.quantLabel}</Text>
                      </View>
                      <View style={[styles.sizeBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.sizeBadgeText, { color: colors.textSecondary }]}>{formatSize(quant.sizeMB * 1024 * 1024)}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerFixed: {
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    flex: 1,
    paddingVertical: SPACING.sm - 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  activeSegmentBtn: {
    // dynamically applied
  },
  segmentText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.huge,
    gap: SPACING.md,
  },
  activeModelCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  activeModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  activeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeModelDetails: {
    flex: 1,
  },
  activeModelLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeModelName: {
    fontSize: FONT_SIZES.md - 1,
    fontWeight: '700',
  },
  activeModelSpecs: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  unloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  unloadBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  searchCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  searchLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    fontSize: FONT_SIZES.sm,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md + 1,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm - 1,
    lineHeight: 18,
  },
  importActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
  },
  importBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  pathLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pathText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    marginTop: 2,
    maxWidth: '90%',
  },
  importBarActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scanTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  scanBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  scanningText: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.sm,
  },
  noResultsText: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  resultsList: {
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  resultsLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  importBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
  },
  importText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: FONT_SIZES.xs,
    marginTop: 1,
  },
  loadBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
  },
  loadText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
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
    flex: 1,
  },
  quantBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  quantBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  sizeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  sizeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  recommendedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  paramsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  paramsBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  quantDivider: {
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  quantDividerText: {
    fontSize: FONT_SIZES.xs - 2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
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
  noResults: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  importNativeCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)', // glowing purple neon accent
  },
  importNativeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  importNativeTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  importNativeDesc: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  importNativeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.xl,
  },
  importNativeBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  filterChipsCard: {
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  filterChipsScroll: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
});
