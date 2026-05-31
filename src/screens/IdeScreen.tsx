import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWorkspaceStore, FileItem } from '../store/useWorkspaceStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../theme';

const getFileIcon = (fileName: string, isDirectory: boolean) => {
  if (isDirectory) return { name: 'folder', color: '#3b82f6' };
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js':
      return { name: 'logo-javascript', color: '#f59e0b' };
    case 'ts':
      return { name: 'logo-typescript', color: '#0ea5e9' };
    case 'py':
      return { name: 'logo-python', color: '#10b981' };
    case 'md':
      return { name: 'document-text', color: '#8b5cf6' };
    case 'json':
      return { name: 'code-working', color: '#ec4899' };
    case 'html':
      return { name: 'logo-html5', color: '#f97316' };
    case 'css':
      return { name: 'logo-css3', color: '#6366f1' };
    default:
      return { name: 'document-outline', color: '#64748b' };
  }
};

export const IdeScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const { files, activeFileId, addFile, updateFileContent, deleteFile, setActiveFileId, terminalHistory } =
    useWorkspaceStore();

  const [showExplorer, setShowExplorer] = useState(true);
  const [newFileName, setNewFileName] = useState('');
  const [openTabs, setOpenTabs] = useState<string[]>(['1', '2', '4']);
  const [showAgentLog, setShowAgentLog] = useState(true);

  const currentFile = files.find((f) => f.id === activeFileId);

  // Automatically add active file to tabs if not already present
  useEffect(() => {
    if (activeFileId && !openTabs.includes(activeFileId)) {
      setOpenTabs((prev) => [...prev, activeFileId]);
    }
  }, [activeFileId]);

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim();
    const newId = addFile(cleanName, 'file', '');
    setOpenTabs((prev) => [...prev, newId]);
    setNewFileName('');
  };

  const handleDeleteFile = (id: string, name: string) => {
    Alert.alert('Delete File', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteFile(id);
          setOpenTabs((prev) => prev.filter((tabId) => tabId !== id));
        },
      },
    ]);
  };

  const closeTab = (tabId: string) => {
    const nextTabs = openTabs.filter((id) => id !== tabId);
    setOpenTabs(nextTabs);
    if (activeFileId === tabId) {
      if (nextTabs.length > 0) {
        setActiveFileId(nextTabs[nextTabs.length - 1]);
      } else {
        setActiveFileId(null);
      }
    }
  };

  const getLineNumbers = () => {
    if (!currentFile || !currentFile.content) return '1';
    const lines = currentFile.content.split('\n').length;
    return Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  };

  const getFileMetrics = () => {
    if (!currentFile || !currentFile.content) return { lines: 0, words: 0, chars: 0 };
    const text = currentFile.content;
    const lines = text.split('\n').length;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { lines, words, chars };
  };

  const renderFileItem = ({ item }: { item: FileItem }) => {
    const isActive = item.id === activeFileId;
    const icon = getFileIcon(item.name, item.type === 'folder');

    return (
      <TouchableOpacity
        style={[
          styles.fileItem,
          { backgroundColor: isActive ? colors.primary + '12' : 'transparent' },
          isActive && { borderLeftColor: colors.primary, borderLeftWidth: 3 },
        ]}
        onPress={() => item.type === 'file' && setActiveFileId(item.id)}
        onLongPress={() => item.type === 'file' && handleDeleteFile(item.id, item.name)}
        activeOpacity={0.7}
      >
        <Icon name={icon.name} size={18} color={icon.color} style={styles.fileIconSpacing} />
        <Text
          style={[
            styles.fileName,
            {
              color: isActive ? colors.text : colors.textSecondary,
              fontWeight: isActive ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.type === 'file' && (
          <TouchableOpacity
            onPress={() => handleDeleteFile(item.id, item.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash-outline" size={14} color={colors.textTertiary} style={styles.trashIcon} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const metrics = getFileMetrics();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sub-Header Actions */}
      <View style={[styles.subHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.subHeaderLeft}>
          <TouchableOpacity
            onPress={() => setShowExplorer(!showExplorer)}
            style={[styles.headerBtn, { backgroundColor: colors.primary + '12' }]}
            activeOpacity={0.8}
          >
            <Icon name="folder-open" size={16} color={colors.primary} />
            <Text style={[styles.headerBtnText, { color: colors.primary }]}>Explorer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowAgentLog(!showAgentLog)}
            style={[
              styles.headerBtn,
              { backgroundColor: showAgentLog ? colors.success + '12' : colors.surfaceVariant },
            ]}
            activeOpacity={0.8}
          >
            <Icon name="pulse" size={16} color={showAgentLog ? colors.success : colors.textSecondary} />
            <Text style={[styles.headerBtnText, { color: showAgentLog ? colors.success : colors.textSecondary }]}>
              Agent Logs
            </Text>
          </TouchableOpacity>
        </View>

        {currentFile && (
          <View style={styles.filePathRow}>
            <Icon name="logo-code-nav" size={14} color={colors.primary} />
            <Text style={[styles.activePathText, { color: colors.textSecondary }]} numberOfLines={1}>
              pocketllm-workspace / {currentFile.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.editorBody}>
        {/* Explorer Sidebar */}
        {showExplorer && (
          <View style={[styles.explorer, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
            <View style={styles.explorerTitleRow}>
              <Icon name="file-tray-stacked-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.explorerTitle, { color: colors.textTertiary }]}>WORKSPACE FILES</Text>
            </View>
            <FlatList
              data={files}
              keyExtractor={(item) => item.id}
              renderItem={renderFileItem}
              style={styles.fileList}
              contentContainerStyle={styles.fileListContent}
            />
            <View style={[styles.newFileRow, { borderTopColor: colors.border }]}>
              <TextInput
                style={[
                  styles.newFileInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={newFileName}
                onChangeText={setNewFileName}
                placeholder="newfile.js"
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={handleCreateFile}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={handleCreateFile}
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Icon name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Code Editor Panel */}
        <View style={styles.editorPanel}>
          {/* Horizontal Scrolling Tab Bar */}
          {openTabs.length > 0 && (
            <View style={[styles.tabsBar, { backgroundColor: darkMode ? '#0e1320' : '#f8fafc', borderBottomColor: colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                {openTabs.map((tabId) => {
                  const tabFile = files.find((f) => f.id === tabId);
                  if (!tabFile) return null;
                  const isTabActive = tabId === activeFileId;
                  const tabIcon = getFileIcon(tabFile.name, false);

                  return (
                    <TouchableOpacity
                      key={tabId}
                      style={[
                        styles.tabItem,
                        { backgroundColor: isTabActive ? colors.surface : 'transparent', borderBottomColor: isTabActive ? colors.primary : 'transparent' },
                        isTabActive && SHADOWS.xs,
                      ]}
                      onPress={() => setActiveFileId(tabId)}
                      activeOpacity={0.8}
                    >
                      <Icon name={tabIcon.name} size={14} color={tabIcon.color} style={{ marginRight: 6 }} />
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: isTabActive ? colors.text : colors.textSecondary,
                            fontWeight: isTabActive ? '700' : '500',
                          },
                        ]}
                      >
                        {tabFile.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => closeTab(tabId)}
                        style={styles.closeTabBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="close" size={12} color={isTabActive ? colors.textSecondary : colors.textTertiary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {currentFile ? (
            <View style={styles.editorArea}>
              <ScrollView
                style={styles.editorScroll}
                contentContainerStyle={styles.editorScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.codeContainerRow}>
                  {/* Line Numbers */}
                  <View style={[styles.lineNumbersColumn, { borderRightColor: colors.border, backgroundColor: darkMode ? '#0f1422' : '#fcfdfe' }]}>
                    <Text style={[styles.lineNumberText, { color: colors.textTertiary }]}>
                      {getLineNumbers()}
                    </Text>
                  </View>

                  {/* Text Input with Monospace font */}
                  <TextInput
                    style={[
                      styles.codeInput,
                      {
                        color: colors.text,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        fontSize: 13,
                        lineHeight: 20,
                      },
                    ]}
                    value={currentFile.content || ''}
                    onChangeText={(val) => updateFileContent(currentFile.id, val)}
                    multiline
                    placeholder="// Start coding..."
                    placeholderTextColor={colors.textTertiary}
                    textAlignVertical="top"
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoComplete="off"
                  />
                </View>
              </ScrollView>

              {/* Monospace Code Editor Status Bar Footer */}
              <View style={[styles.editorFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <View style={styles.footerLeft}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    UTF-8  ·  {currentFile.language?.toUpperCase() || 'PLAINTEXT'}
                  </Text>
                </View>
                <View style={styles.footerRight}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    Ln {metrics.lines}, Col {metrics.chars}  ·  {metrics.words} words
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + '10' }]}>
                <Icon name="code-slash-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Open Files</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Select a file from the explorer or create a new file to start coding.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Floating Agent Watcher Console logs drawer */}
      {showAgentLog && (
        <View style={[styles.agentLogTray, { backgroundColor: colors.surface, borderTopColor: colors.border }, SHADOWS.md]}>
          <View style={[styles.agentLogHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.agentLogTitle}>
              <View style={[styles.logIndicatorPulse, { backgroundColor: colors.success }]} />
              <Text style={[styles.agentLogTitleText, { color: colors.text }]}>AGENT CONSOLE LOGGER</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAgentLog(false)}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.agentLogScroll}
            contentContainerStyle={styles.agentLogContent}
            ref={(ref) => ref?.scrollToEnd({ animated: true })}
          >
            {terminalHistory.length === 0 ? (
              <Text style={[styles.noLogText, { color: colors.textTertiary }]}>
                No actions taken yet. Instruct your chatbot agent to write files or execute commands!
              </Text>
            ) : (
              terminalHistory.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={[styles.logTime, { color: colors.textTertiary }]}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Text>
                  <Text style={[styles.logCmd, { color: colors.primary }]}>$ {log.command}</Text>
                  {log.output ? (
                    <Text style={[styles.logOutput, { color: colors.textSecondary }]} numberOfLines={2}>
                      {log.output.trim()}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
  },
  headerBtnText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  filePathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '50%',
  },
  activePathText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  editorBody: {
    flex: 1,
    flexDirection: 'row',
  },
  explorer: {
    width: 170,
    borderRightWidth: 1,
  },
  explorerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  explorerTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fileList: {
    flex: 1,
  },
  fileListContent: {
    paddingVertical: SPACING.xs,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm - 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  fileIconSpacing: {
    width: 18,
    textAlign: 'center',
  },
  fileName: {
    fontSize: FONT_SIZES.sm - 1,
    flex: 1,
  },
  trashIcon: {
    padding: 2,
  },
  newFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    padding: SPACING.sm,
    gap: 4,
  },
  newFileInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: FONT_SIZES.xs,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorPanel: {
    flex: 1,
    flexDirection: 'column',
  },
  tabsBar: {
    borderBottomWidth: 1,
    height: 38,
  },
  tabsScrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FONT_SIZES.xs,
    marginRight: 6,
  },
  closeTabBtn: {
    padding: 1,
    borderRadius: 2,
  },
  editorArea: {
    flex: 1,
    flexDirection: 'column',
  },
  editorScroll: {
    flex: 1,
  },
  editorScrollContent: {
    flexGrow: 1,
  },
  codeContainerRow: {
    flexDirection: 'row',
    minHeight: '100%',
  },
  lineNumbersColumn: {
    width: 32,
    borderRightWidth: 1,
    paddingTop: SPACING.md,
    alignItems: 'center',
  },
  lineNumberText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
  codeInput: {
    flex: 1,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    textAlignVertical: 'top',
  },
  editorFooter: {
    height: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  footerLeft: {
    flexDirection: 'row',
  },
  footerRight: {
    flexDirection: 'row',
  },
  footerText: {
    fontSize: 9,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm - 1,
    textAlign: 'center',
    lineHeight: 18,
  },
  agentLogTray: {
    height: 120,
    borderTopWidth: 1,
  },
  agentLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  agentLogTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logIndicatorPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  agentLogTitleText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  agentLogScroll: {
    flex: 1,
  },
  agentLogContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  noLogText: {
    fontSize: FONT_SIZES.xs - 1,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  logRow: {
    marginBottom: 6,
  },
  logTime: {
    fontSize: 8,
    fontWeight: '500',
  },
  logCmd: {
    fontSize: 10,
    fontWeight: '700',
    marginVertical: 1,
  },
  logOutput: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 6,
  },
});