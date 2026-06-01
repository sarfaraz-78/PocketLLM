import { useMemo, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { useWorkspaceStore, FileItem } from '../store/useWorkspaceStore';
import { useToast } from '../hooks/useToast';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme/tokens';

export interface FindResult {
  file: FileItem;
  matches: { line: number; lineContent: string; matchIndex: number }[];
}

export const useFindInFiles = () => {
  const files = useWorkspaceStore((s) => s.files);
  const setActiveFileId = useWorkspaceStore((s) => s.setActiveFileId);

  const search = useCallback(
    (query: string, caseSensitive: boolean = false): FindResult[] => {
      if (!query.trim()) return [];
      const q = caseSensitive ? query : query.toLowerCase();
      const results: FindResult[] = [];

      for (const f of files) {
        if (f.type !== 'file' || !f.content) continue;
        const lines = f.content.split('\n');
        const matches: FindResult['matches'] = [];
        for (let i = 0; i < lines.length; i++) {
          const haystack = caseSensitive ? lines[i] : lines[i].toLowerCase();
          let idx = haystack.indexOf(q);
          while (idx !== -1) {
            matches.push({ line: i, lineContent: lines[i], matchIndex: idx });
            idx = haystack.indexOf(q, idx + q.length);
          }
        }
        if (matches.length > 0) {
          results.push({ file: f, matches });
        }
      }
      return results;
    },
    [files]
  );

  const jumpToMatch = useCallback(
    (result: FindResult) => {
      setActiveFileId(result.file.id);
    },
    [setActiveFileId]
  );

  return { search, jumpToMatch };
};

interface FindInFilesBarProps {
  onClose: () => void;
}

export const FindInFilesBarBase: React.FC<FindInFilesBarProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const { show } = useToast();
  const { search, jumpToMatch } = useFindInFiles();
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<FindResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim()) {
      const r = search(q, caseSensitive);
      setResults(r);
      setShowResults(true);
      if (r.length === 0) {
        show('No matches found', { variant: 'info' });
      }
    } else {
      setShowResults(false);
      setResults([]);
    }
  };

  const totalMatches = results.reduce((s, r) => s + r.matches.length, 0);

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Icon name="search" size={16} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Find in files..."
          placeholderTextColor={colors.textTertiary}
          autoFocus
          style={[styles.input, { color: colors.text }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setCaseSensitive(!caseSensitive)}
            hitSlop={6}
            style={[
              styles.toggle,
              {
                backgroundColor: caseSensitive ? colors.primary : 'transparent',
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                { color: caseSensitive ? '#fff' : colors.textTertiary },
              ]}
            >
              Aa
            </Text>
          </TouchableOpacity>
        )}
        {query.length > 0 && (
          <Text style={[styles.count, { color: colors.textTertiary }]}>
            {totalMatches}
          </Text>
        )}
        <TouchableOpacity onPress={onClose} hitSlop={8}>
          <Icon name="close" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {showResults && results.length > 0 && (
        <ScrollView
          style={[
            styles.resultsPanel,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {results.map((r) => (
            <View key={r.file.id} style={styles.fileGroup}>
              <View style={styles.fileHeader}>
                <Icon name="document-text-outline" size={12} color={colors.primary} />
                <Text
                  style={[styles.fileName, { color: colors.text }]}
                  onPress={() => {
                    jumpToMatch(r);
                    onClose();
                  }}
                >
                  {r.file.name}
                </Text>
                <Text style={[styles.fileCount, { color: colors.textTertiary }]}>
                  {r.matches.length}
                </Text>
              </View>
              {r.matches.slice(0, 3).map((m, idx) => (
                <View key={idx} style={styles.matchLine}>
                  <Text style={[styles.lineNum, { color: colors.textTertiary }]}>
                    {m.line + 1}
                  </Text>
                  <Text
                    style={[styles.matchText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {m.lineContent.trim() || ' '}
                  </Text>
                </View>
              ))}
              {r.matches.length > 3 && (
                <Text style={[styles.more, { color: colors.textTertiary }]}>
                  +{r.matches.length - 3} more
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    gap: SPACING.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    padding: 0,
  },
  toggle: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  count: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  resultsPanel: {
    maxHeight: 300,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.xs,
  },
  fileGroup: {
    padding: SPACING.xs,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  fileName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    flex: 1,
  },
  fileCount: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  matchLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingVertical: 2,
    gap: SPACING.xs,
  },
  lineNum: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'monospace',
    width: 24,
    textAlign: 'right',
  },
  matchText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: 'monospace',
    flex: 1,
  },
  more: {
    fontSize: FONT_SIZES.xs,
    paddingLeft: 18,
    paddingTop: 2,
  },
});

export const FindInFilesBar = memo(FindInFilesBarBase);
