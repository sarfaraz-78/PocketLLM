import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../theme/tokens';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

const CodeBlockBase: React.FC<CodeBlockProps> = ({
  code,
  language,
  showLineNumbers = true,
}) => {
  const { colors } = useTheme();
  const { show } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => code.split('\n'), [code]);
  const isLong = lines.length > 12;
  const visibleLines = isLong && collapsed ? lines.slice(0, 12) : lines;
  const langLabel = (language || 'text').toUpperCase();

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    show('Code copied to clipboard', { variant: 'success' });
    setTimeout(() => setCopied(false), 1500);
  };

  const languageColors: Record<string, string> = {
    javascript: '#F7DF1E',
    typescript: '#3178C6',
    python: '#3776AB',
    java: '#ED8B00',
    kotlin: '#A97BFF',
    swift: '#FA7343',
    rust: '#DEA584',
    go: '#00ADD8',
    cpp: '#00599C',
    c: '#A8B9CC',
    html: '#E34F26',
    css: '#1572B6',
    json: '#292929',
    bash: '#4EAA25',
    shell: '#4EAA25',
    sql: '#4479A1',
    jsx: '#61DAFB',
    tsx: '#3178C6',
  };

  const accentColor = languageColors[language?.toLowerCase() || ''] || colors.textTertiary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <View style={styles.langRow}>
          <View style={[styles.dot, { backgroundColor: accentColor }]} />
          <Text style={[styles.langLabel, { color: colors.textTertiary }]}>
            {langLabel}
          </Text>
          <Text style={[styles.lineCount, { color: colors.textTertiary }]}>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleCopy} hitSlop={8} style={styles.copyBtn}>
          <Icon
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? colors.success : colors.textTertiary}
          />
          <Text
            style={[
              styles.copyText,
              { color: copied ? colors.success : colors.textTertiary },
            ]}
          >
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.codeScroll}
      >
        <View>
          {visibleLines.map((line, idx) => (
            <View key={idx} style={styles.line}>
              {showLineNumbers && (
                <Text
                  style={[
                    styles.lineNumber,
                    { color: colors.textTertiary },
                  ]}
                >
                  {String(idx + 1).padStart(2, ' ')}
                </Text>
              )}
              <Text
                style={[
                  styles.code,
                  {
                    color: colors.text,
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  },
                ]}
                selectable
              >
                {line || ' '}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {isLong && (
        <TouchableOpacity
          onPress={() => setCollapsed((c) => !c)}
          style={[
            styles.collapse,
            { borderTopColor: colors.divider, backgroundColor: colors.surfaceElevated },
          ]}
        >
          <Icon
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={14}
            color={colors.primary}
          />
          <Text style={[styles.collapseText, { color: colors.primary }]}>
            {collapsed
              ? `Show all ${lines.length} lines`
              : 'Collapse'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const CodeBlock = React.memo(CodeBlockBase);

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  langLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  lineCount: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  copyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  codeScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lineNumber: {
    fontSize: FONT_SIZES.xs,
    width: 24,
    textAlign: 'right',
    marginRight: SPACING.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  code: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  collapse: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
  },
  collapseText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
