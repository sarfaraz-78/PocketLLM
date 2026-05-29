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
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelStore } from '../store/useModelStore';
import { llamaEngine, extractModelSpecs } from '../inference/LlamaEngine';
import { ModelFileManager } from '../services/ModelFileManager';
import { scanForModels, ScanResult } from '../services/ModelScanner';
import { pickFiles } from '../services/NativeFilePicker';
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
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
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

  const handleScan = async () => {
    setScanning(true);
    try {
      const results = await scanForModels();
      setScanResults(results);
    } catch (e) {
      Alert.alert('Scan Failed', 'Could not scan for model files');
    } finally {
      setScanning(false);
    }
  };

  const handleImportScanned = async (item: { path: string; name: string; mmprojPath?: string }) => {
    try {
      const modelDir = await ModelFileManager.getModelDirectory();
      const destPath = `${modelDir}/${item.name}`;

      if (await RNFS.exists(destPath)) {
        await loadModelFromPath(destPath, item.name, item.mmprojPath);
        return;
      }

      await RNFS.copyFile(item.path, destPath);

      let mmprojDestPath: string | undefined;
      if (item.mmprojPath) {
        const mmprojName = item.mmprojPath.split('/').pop() || '';
        mmprojDestPath = `${modelDir}/${mmprojName}`;
        if (!(await RNFS.exists(mmprojDestPath))) {
          await RNFS.copyFile(item.mmprojPath, mmprojDestPath);
        }
      }

      await loadModelFromPath(destPath, item.name, mmprojDestPath);
    } catch (error) {
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleLoadModel = async (file: FileItem) => {
    if (!isGguf(file.name)) return;
    await loadModelFromPath(file.path, file.name, undefined);
  };

  const loadModelFromPath = async (filePath: string, fileName: string, mmprojPath?: string) => {
    const modelName = fileName.replace(/\.gguf$/i, '');
    try {
      const stat = await RNFS.stat(filePath);
      await llamaEngine.loadModel(filePath, deviceTier || DeviceTier.MEDIUM, mmprojPath);

      let specs: ModelInfo['specs'] = undefined;
      try {
        specs = await extractModelSpecs(filePath);
      } catch (e) {
        console.warn('[LocalModels] Could not extract specs:', e);
      }

      const model: ModelInfo = {
        id: fileName,
        name: modelName,
        repoId: 'local',
        fileName: fileName,
        downloadUrl: '',
        sizeMB: Math.round(stat.size / (1024 * 1024)),
        quantization: 'unknown',
        params: extractParams(fileName),
        architecture: 'unknown',
        tier: deviceTier || DeviceTier.MEDIUM,
        localPath: filePath,
        downloadStatus: 'downloaded',
        specs,
        mmprojPath,
        isMultimodal: !!mmprojPath,
      };

      setActiveModel(model);
      addDownloadedModel(model);
      Alert.alert('Success', `${modelName} loaded!`);

      loadDirectory(currentPath);
    } catch (error) {
      Alert.alert('Load Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const navigateUp = () => {
    const parent = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (parent && parent !== currentPath) {
      setCurrentPath(parent);
    }
  };

  const handleImport = async () => {
    try {
      const picked = await pickFiles();
      if (!picked || picked.length === 0) return;

      const modelDir = await ModelFileManager.getModelDirectory();
      const importedNames: string[] = [];
      const skippedNames: string[] = [];

      for (const file of picked) {
        if (!isGguf(file.name)) continue;
        const destPath = `${modelDir}/${file.name}`;

        if (await RNFS.exists(destPath)) {
          skippedNames.push(file.name);
          continue;
        }

        try {
          await RNFS.copyFile(file.path, destPath);
          importedNames.push(file.name);
        } catch (e) {
          console.warn(`Failed to copy ${file.name}:`, e);
          skippedNames.push(file.name + ' (failed)');
        }
      }

      loadDirectory(currentPath);

      let message = '';
      if (importedNames.length > 0) {
        message += `Imported ${importedNames.length} file(s):\n${importedNames.join('\n')}`;
      }
      if (skippedNames.length > 0) {
        if (message) message += '\n\n';
        message += `Skipped ${skippedNames.length} file(s):\n${skippedNames.join('\n')}`;
      }
      Alert.alert('Import Complete', message || 'No files imported');
    } catch (err: any) {
      if (err?.message?.includes('CANCELLED') || err?.code === 'CANCELLED') {
        return;
      }
      Alert.alert('Import Failed', err?.message || 'Could not import files');
    }
  };

  const renderFileItem = ({ item }: { item: FileItem }) => {
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
            <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>Folder</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      );
    }

    const gguf = isGguf(item.name);
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.surface }, SHADOWS.xs, gguf && { borderColor: colors.primary + '30', borderWidth: 1 }]}
        onPress={() => gguf && handleLoadModel(item)}
        activeOpacity={0.7}
        disabled={!gguf}
      >
        <View style={[styles.iconBox, { backgroundColor: gguf ? colors.success + '12' : colors.border }]}>
          <Icon name={gguf ? 'cube' : 'document-outline'} size={22} color={gguf ? colors.success : colors.textTertiary} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>{formatSize(item.size)}</Text>
        </View>
        {gguf && (
          <View style={[styles.loadBadge, { backgroundColor: colors.primary + '12' }]}>
            <Text style={[styles.loadText, { color: colors.primary }]}>Load</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderScanResultItem = (item: { path: string; name: string; size: number; mmprojPath?: string; mmprojName?: string }) => {
    const isVision = !!item.mmprojPath;
    return (
      <View style={[styles.scanRow, { backgroundColor: colors.surface }, SHADOWS.xs]}>
        <View style={[styles.iconBox, { backgroundColor: isVision ? colors.primary + '15' : colors.success + '12' }]}>
          <Icon name={isVision ? 'eye' : 'cube'} size={22} color={isVision ? colors.primary : colors.success} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>
            {formatSize(item.size)}
            {isVision && ' · Vision Model'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.importBadge, { backgroundColor: colors.primary }]}
          onPress={() => handleImportScanned(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.importText}>Import</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Local Models</Text>
          <Text style={[styles.headerPath, { color: colors.textTertiary }]} numberOfLines={1}>
            {currentPath}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleScan} style={styles.headerBtn}>
            <Icon name="search-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImport} style={styles.headerBtn}>
            <Icon name="folder-open-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateUp} style={styles.headerBtn}>
            <Icon name="arrow-up" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scrollContent}>
        <View style={[styles.scanCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
          <View style={styles.scanHeader}>
            <View style={styles.scanTitleRow}>
              <Icon name="scan-outline" size={20} color={colors.primary} />
              <Text style={[styles.scanTitle, { color: colors.text }]}>Auto Finder</Text>
            </View>
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: scanning ? colors.border : colors.primary }]}
              onPress={handleScan}
              disabled={scanning}
              activeOpacity={0.8}
            >
              {scanning ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={styles.scanBtnText}>Scan</Text>
              )}
            </TouchableOpacity>
          </View>

          {scanning && (
            <Text style={[styles.scanningText, { color: colors.textSecondary }]}>
              Scanning Downloads, Documents, and common folders...
            </Text>
          )}

          {scanResults && scanResults.ggufFiles.length === 0 && !scanning && (
            <Text style={[styles.noResults, { color: colors.textSecondary }]}>
              No .gguf model files found in common directories
            </Text>
          )}

          {scanResults && scanResults.ggufFiles.length > 0 && (
            <View style={styles.resultsList}>
              <Text style={[styles.resultsLabel, { color: colors.textSecondary }]}>
                Found {scanResults.ggufFiles.length} model(s)
              </Text>
              {scanResults.ggufFiles.map((item) => (
                <View key={item.path}>{renderScanResultItem(item)}</View>
              ))}
              {scanResults.mmprojFiles.length > 0 && (
                <Text style={[styles.resultsLabel, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
                  {scanResults.mmprojFiles.length} vision projector file(s) paired
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={[styles.hint, { backgroundColor: colors.primary + '08' }]}>
          <Icon name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Tap folder icon to open system file picker and import .gguf files
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
            renderItem={renderFileItem}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icon name="folder-open-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No files found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerPath: { fontSize: FONT_SIZES.xs, marginTop: 2, maxWidth: '90%' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  headerBtn: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  scrollContent: { flex: 1, padding: SPACING.lg, paddingBottom: SPACING.huge },
  scanCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  scanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  scanTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  scanTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  scanBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.xl },
  scanBtnText: { color: '#FFFFFF', fontSize: FONT_SIZES.sm, fontWeight: '600' },
  scanningText: { fontSize: FONT_SIZES.sm, marginBottom: SPACING.sm },
  noResults: { fontSize: FONT_SIZES.sm, textAlign: 'center', paddingVertical: SPACING.md },
  resultsList: { gap: SPACING.sm },
  resultsLabel: { fontSize: FONT_SIZES.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  scanRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, gap: SPACING.md },
  importBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md },
  importText: { color: '#FFFFFF', fontSize: FONT_SIZES.sm, fontWeight: '600' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.lg },
  hintText: { fontSize: FONT_SIZES.sm, flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xxl },
  list: { gap: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, gap: SPACING.md },
  iconBox: { width: 44, height: 44, borderRadius: BORDER_RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowName: { fontSize: FONT_SIZES.md, fontWeight: '500' },
  rowMeta: { fontSize: FONT_SIZES.sm, marginTop: 2 },
  loadBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md },
  loadText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyText: { marginTop: SPACING.md, fontSize: FONT_SIZES.md },
});
