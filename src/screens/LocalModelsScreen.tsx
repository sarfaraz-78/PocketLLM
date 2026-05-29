import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelStore } from '../store/useModelStore';
import { llamaEngine, extractModelSpecs } from '../inference/LlamaEngine';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { ModelInfo, DeviceTier } from '../types';
import { extractParams } from '../utils/paramUtils';

interface FileItem {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
}

export const LocalModelsScreen: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { deviceTier, darkMode } = useSettingsStore();
  const { setActiveModel, addDownloadedModel } = useModelStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  useEffect(() => {
    loadDirectory(currentPath);
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const items = await RNFS.readDir(path);
      const mapped: FileItem[] = items.map((item) => ({
        name: item.name,
        path: item.path,
        size: item.size,
        isDirectory: item.isDirectory(),
      }));
      // Sort: directories first, then by name
      mapped.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(mapped);
    } catch (error) {
      console.error('Error reading directory:', error);
      Alert.alert('Error', 'Cannot access this folder');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isGguf = (name: string) => name.toLowerCase().endsWith('.gguf');

  const handleLoadModel = async (file: FileItem) => {
    if (!isGguf(file.name)) return;

    const modelName = file.name.replace(/\.gguf$/i, '');
    Alert.alert(
      'Load Model',
      `Load ${modelName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            try {
              await llamaEngine.loadModel(file.path, deviceTier || DeviceTier.MEDIUM, undefined);

              // Extract specs from the GGUF file
              let specs: ModelInfo['specs'] = undefined;
              try {
                specs = await extractModelSpecs(file.path);
              } catch (e) {
                console.warn('[LocalModels] Could not extract specs:', e);
              }

              const model: ModelInfo = {
                id: `local-${Date.now()}`,
                name: modelName,
                repoId: 'local',
                fileName: file.name,
                downloadUrl: '',
                sizeMB: Math.round(file.size / (1024 * 1024)),
                quantization: 'unknown',
                params: extractParams(file.name),
                architecture: 'unknown',
                tier: deviceTier || DeviceTier.MEDIUM,
                localPath: file.path,
                downloadStatus: 'downloaded',
                specs,
              };

              setActiveModel(model);
              addDownloadedModel(model);
              Alert.alert('Success', `${modelName} loaded!`);
            } catch (error) {
              Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unknown error');
            }
          },
        },
      ]
    );
  };

  const navigateUp = () => {
    const parent = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (parent && parent !== currentPath) {
      setCurrentPath(parent);
    }
  };

  const renderItem = ({ item }: { item: FileItem }) => {
    if (item.isDirectory) {
      return (
        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.surface }, SHADOWS.xs]}
          onPress={() => setCurrentPath(item.path)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primary + '12' }]}>
            <Icon name="folder" size={22} color={colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>
              Folder
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      );
    }

    const gguf = isGguf(item.name);
    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.surface },
          SHADOWS.xs,
          gguf && { borderColor: colors.primary + '30', borderWidth: 1 },
        ]}
        onPress={() => gguf && handleLoadModel(item)}
        activeOpacity={0.7}
        disabled={!gguf}
      >
        <View style={[styles.iconBox, { backgroundColor: gguf ? colors.success + '12' : colors.border }]}>
          <Icon
            name={gguf ? 'cube' : 'document-outline'}
            size={22}
            color={gguf ? colors.success : colors.textTertiary}
          />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>
            {formatSize(item.size)}
          </Text>
        </View>
        {gguf && (
          <View style={[styles.loadBadge, { backgroundColor: colors.primary + '12' }]}>
            <Text style={[styles.loadText, { color: colors.primary }]}>Load</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Local Models</Text>
          <Text style={[styles.headerPath, { color: colors.textTertiary }]} numberOfLines={1}>
            {currentPath}
          </Text>
        </View>
        <TouchableOpacity onPress={navigateUp} style={styles.upBtn}>
          <Icon name="arrow-up" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* GGUF hint */}
      <View style={[styles.hint, { backgroundColor: colors.primary + '08' }]}>
        <Icon name="information-circle-outline" size={16} color={colors.primary} />
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          Tap any .gguf file to load it as a model
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.path}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="folder-open-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No files found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerPath: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
    maxWidth: '90%',
  },
  upBtn: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  hintText: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.huge,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  rowMeta: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  loadBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  loadText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: SPACING.huge,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
});
