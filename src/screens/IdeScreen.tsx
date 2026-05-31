import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/useSettingsStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
}

const LANGUAGES = ['js', 'ts', 'py', 'java', 'kt', 'cpp', 'c', 'rs', 'go', 'rb', 'swift', 'md', 'json', 'html', 'css'];

const getLanguageFromExt = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', py: 'python', java: 'java',
    kt: 'kotlin', cpp: 'cpp', c: 'c', rs: 'rust', go: 'go',
    rb: 'ruby', swift: 'swift', md: 'markdown', json: 'json',
    html: 'html', css: 'css', xml: 'xml', txt: 'text',
  };
  return map[ext] || 'text';
};

export const IdeScreen: React.FC = () => {
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;

  const [files, setFiles] = useState<FileItem[]>([
    { id: '1', name: 'main.js', type: 'file', language: 'javascript', content: '// Welcome to PocketLLM IDE\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));' },
    { id: '2', name: 'app.ts', type: 'file', language: 'typescript', content: '// TypeScript example\nconst greet = (name: string): string => `Hello, ${name}!`;' },
    { id: '3', name: 'utils', type: 'folder' },
    { id: '4', name: 'README.md', type: 'file', language: 'markdown', content: '# PocketLLM IDE\n\nCode smarter with AI assistance.' },
  ]);

  const [activeFile, setActiveFile] = useState<string | null>('1');
  const [showExplorer, setShowExplorer] = useState(true);
  const [newFileName, setNewFileName] = useState('');

  const currentFile = files.find(f => f.id === activeFile);

  const createFile = () => {
    if (!newFileName.trim()) return;
    const ext = newFileName.split('.').pop() || 'txt';
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      type: 'file',
      language: getLanguageFromExt(newFileName),
      content: '',
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFile(newFile.id);
    setNewFileName('');
  };

  const updateFileContent = (content: string) => {
    if (!activeFile) return;
    setFiles(prev => prev.map(f =>
      f.id === activeFile ? { ...f, content } : f
    ));
  };

  const deleteFile = (id: string) => {
    Alert.alert('Delete File', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setFiles(prev => prev.filter(f => f.id !== id));
          if (activeFile === id) setActiveFile(null);
        },
      },
    ]);
  };

  const renderFile = ({ item }: { item: FileItem }) => {
    const isActive = item.id === activeFile;
    return (
      <TouchableOpacity
        style={[
          styles.fileItem,
          { borderLeftColor: isActive ? colors.primary : 'transparent' },
        ]}
        onPress={() => item.type === 'file' && setActiveFile(item.id)}
        onLongPress={() => item.type === 'file' && deleteFile(item.id)}
      >
        <Icon
          name={item.type === 'folder' ? 'folder' : 'document-text'}
          size={18}
          color={isActive ? colors.primary : colors.textTertiary}
        />
        <Text
          style={[
            styles.fileName,
            { color: isActive ? colors.primary : colors.text },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Icon name="code-slash" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>IDE</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowExplorer(!showExplorer)} style={styles.headerBtn}>
            <Icon name="folder-open-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Run', 'Execute current file')} style={styles.headerBtn}>
            <Icon name="play-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.editorContainer}>
        {showExplorer && (
          <View style={[styles.explorer, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
            <View style={styles.explorerHeader}>
              <Text style={[styles.explorerTitle, { color: colors.textSecondary }]}>EXPLORER</Text>
            </View>
            <FlatList
              data={files}
              keyExtractor={item => item.id}
              renderItem={renderFile}
              style={styles.fileList}
            />
            <View style={[styles.newFileContainer, { borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.newFileInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={newFileName}
                onChangeText={setNewFileName}
                placeholder="filename.ext"
                placeholderTextColor={colors.textTertiary}
                onSubmitEditing={createFile}
              />
              <TouchableOpacity onPress={createFile} style={styles.addBtn}>
                <Icon name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.editorArea}>
          {currentFile ? (
            <>
              <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.tab}>
                  <Icon name="document-text" size={14} color={colors.textTertiary} />
                  <Text style={[styles.tabName, { color: colors.text }]}>{currentFile.name}</Text>
                  <TouchableOpacity onPress={() => setActiveFile(null)}>
                    <Icon name="close-outline" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView style={styles.codeContainer}>
                <TextInput
                  style={[styles.codeInput, { color: colors.text }]}
                  value={currentFile.content || ''}
                  onChangeText={updateFileContent}
                  multiline
                  placeholder="// Start coding..."
                  placeholderTextColor={colors.textTertiary}
                  textAlignVertical="top"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="code-slash" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Select a file to edit
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                Or create a new file from the explorer
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  headerBtn: {
    padding: SPACING.xs,
  },
  editorContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  explorer: {
    width: 200,
    borderRightWidth: 1,
  },
  explorerHeader: {
    padding: SPACING.sm,
    borderBottomWidth: 1,
  },
  explorerTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fileList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderLeftWidth: 2,
  },
  fileName: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  newFileContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  newFileInput: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  addBtn: {
    padding: SPACING.xs,
    justifyContent: 'center',
  },
  editorArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    padding: SPACING.xs,
    borderBottomWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabName: {
    fontSize: FONT_SIZES.sm,
  },
  codeContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  codeInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: 'monospace',
    minHeight: 300,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
  },
});