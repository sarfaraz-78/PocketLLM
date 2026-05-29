import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import RNFS from 'react-native-fs';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelStore } from '../store/useModelStore';
import { llamaEngine, extractModelSpecs } from '../inference/LlamaEngine';
import { ModelFileManager } from '../services/ModelFileManager';
import { scanForModels, ScanResult } from '../services/ModelScanner';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';
import { ModelInfo, DeviceTier } from '../types';
import { extractParams } from '../utils/paramUtils';

interface FileItem {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
}

interface BrowserFileItem extends FileItem {
  selected: boolean;
}

export const LocalModelsScreen: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browserPath, setBrowserPath] = useState(RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath);
  const [browserFiles, setBrowserFiles] = useState<BrowserFileItem[]>([]);
  const [browserLoading, setBrowserLoading] = useState(false);
  const [browserSearch, setBrowserSearch] = useState('');
  const [importing, setImporting] = useState(false);
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

  const loadBrowserDirectory = useCallback(async (path: string) => {
    setBrowserLoading(true);
    setBrowserSearch('');
    try {
      const items = await RNFS.readDir(path);
      const mapped: BrowserFileItem[] = items
        .map((item) => ({
          name: item.name,
          path: item.path,
          size: item.size,
          isDirectory: item.isDirectory(),
          selected: false,
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      setBrowserFiles(mapped);
    } catch (error) {
      console.error('Error reading browser directory:', error);
      Alert.alert('Error', 'Cannot access this folder');
    } finally {
      setBrowserLoading(false);
    }
  }, []);

  const openBrowser = () => {
    setBrowserPath(RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath);
    loadBrowserDirectory(RNFS.ExternalStorageDirectoryPath || RNFS.DocumentDirectoryPath);
    setBrowserVisible(true);
  };

  const browserNavigate = (item: FileItem) => {
    if (item.isDirectory) {
      setBrowserPath(item.path);
      loadBrowserDirectory(item.path);
    } else {
      toggleFileSelection(item.path);
    }
  };

  const browserNavigateUp = () => {
    const parent = browserPath.substring(0, browserPath.lastIndexOf('/'));
    if (parent && parent !== browserPath) {
      setBrowserPath(parent);
      loadBrowserDirectory(parent);
    }
  };

  const toggleFileSelection = (path: string) => {
    setBrowserFiles((prev) =>
      prev.map((f) => (f.path === path && !f.isDirectory ? { ...f, selected: !f.selected } : f))
    );
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

  const handleBrowserImport = async () => {
    const selected = browserFiles.filter((f) => f.selected && isGguf(f.name));
    if (selected.length === 0) {
      Alert.alert('No Files Selected', 'Please select .gguf model files to import');
      return;
    }

    setImporting(true);
    const modelDir = await ModelFileManager.getModelDirectory();
    const importedNames: string[] = [];
    const skippedNames: string[] = [];

    for (const file of selected) {
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

    setImporting(false);
    setBrowserVisible(false);
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
  };

  const selectedCount = browserFiles.filter((f) => f.selected).length;

  const filteredBrowserFiles = browserSearch
    ? browserFiles.filter((f) => f.name.toLowerCase().includes(browserSearch.toLowerCase()))
    : browserFiles;

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

  const renderBrowserItem = ({ item }: { item: BrowserFileItem }) => {
    if (item.isDirectory) {
      return (
        <TouchableOpacity
          style={[styles.browserRow, { backgroundColor: colors.surface }]}
          onPress={() => browserNavigate(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primary + '12' }]}>
            <Icon name="folder" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.rowName, { color: colors.text, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
          <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      );
    }

    const gguf = isGguf(item.name);
    if (!gguf) return null;

    return (
      <TouchableOpacity
        style={[styles.browserRow, { backgroundColor: item.selected ? colors.primary + '18' : colors.surface }]}
        onPress={() => toggleFileSelection(item.path)}
        activeOpacity={0.7}
      >
        <Icon
          name={item.selected ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.selected ? colors.primary : colors.textTertiary}
        />
        <View style={[styles.iconBox, { backgroundColor: colors.success + '12', marginLeft: SPACING.sm }]}>
          <Icon name="cube" size={20} color={colors.success} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>{formatSize(item.size)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const pathParts = browserPath.split('/').filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <TouchableOpacity onPress={openBrowser} style={styles.headerBtn}>
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
            Browse folders below, or tap the folder icon to import
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

      <Modal visible={browserVisible} animationType="slide" onRequestClose={() => setBrowserVisible(false)}>
        <View style={[styles.browserContainer, { backgroundColor: colors.background }]}>
          <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

          <View style={[styles.browserHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setBrowserVisible(false)} style={styles.browserCloseBtn}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.browserTitleContainer}>
              <Text style={[styles.browserTitle, { color: colors.text }]}>File Manager</Text>
              <View style={styles.breadcrumb}>
                {pathParts.slice(0, 4).map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Text style={{ color: colors.textTertiary }}> / </Text>}
                    <Text style={[styles.breadcrumbPart, { color: i === pathParts.slice(0, 4).length - 1 ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                      {part}
                    </Text>
                  </React.Fragment>
                ))}
                {pathParts.length > 4 && <Text style={{ color: colors.textTertiary }}> ... </Text>}
              </View>
            </View>
            <TouchableOpacity
              onPress={browserNavigateUp}
              style={styles.browserUpBtn}
              disabled={pathParts.length <= 1}
            >
              <Icon name="arrow-up" size={20} color={pathParts.length <= 1 ? colors.border : colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.browserSearchContainer, { backgroundColor: colors.surface }]}>
            <Icon name="search" size={18} color={colors.textTertiary} style={{ marginRight: SPACING.sm }} />
            <TextInput
              style={[styles.browserSearchInput, { color: colors.text }]}
              placeholder="Filter files..."
              placeholderTextColor={colors.textTertiary}
              value={browserSearch}
              onChangeText={setBrowserSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {browserSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBrowserSearch('')}>
                <Icon name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredBrowserFiles}
            keyExtractor={(item) => item.path}
            renderItem={renderBrowserItem}
            contentContainerStyle={styles.browserList}
            ListEmptyComponent={
              browserLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={styles.empty}>
                  <Icon name="folder-open-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {browserSearch ? 'No matching files' : 'Empty folder'}
                  </Text>
                </View>
              )
            }
          />

          {selectedCount > 0 && (
            <View style={[styles.browserFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <Text style={[styles.selectedCount, { color: colors.text }]}>
                {selectedCount} file{selectedCount > 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity
                style={[styles.importBtn, { backgroundColor: colors.primary }]}
                onPress={handleBrowserImport}
                disabled={importing}
                activeOpacity={0.8}
              >
                {importing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="download-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.importBtnText}>Import</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
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
  browserContainer: { flex: 1 },
  browserHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: Platform.OS === 'ios' ? SPACING.lg : SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1 },
  browserCloseBtn: { padding: SPACING.sm },
  browserTitleContainer: { flex: 1, marginHorizontal: SPACING.sm },
  browserTitle: { fontSize: 18, fontWeight: '700' },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  breadcrumbPart: { fontSize: FONT_SIZES.xs, maxWidth: 80 },
  browserUpBtn: { padding: SPACING.sm },
  browserSearchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginHorizontal: SPACING.md, marginVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  browserSearchInput: { flex: 1, fontSize: FONT_SIZES.md, padding: 0 },
  browserList: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl, gap: 2 },
  browserRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm },
  browserFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderTopWidth: 1 },
  selectedCount: { fontSize: FONT_SIZES.md, fontWeight: '600' },
  importBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.xl },
  importBtnText: { color: '#FFFFFF', fontSize: FONT_SIZES.md, fontWeight: '700' },
});
