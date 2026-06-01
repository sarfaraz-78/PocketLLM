import React, { useMemo } from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';
import { CodeBlock } from './CodeBlock';
import { SPACING, FONT_SIZES, FONT_WEIGHTS } from '../theme/tokens';

interface MarkdownLiteProps {
  text: string;
  baseStyle?: TextStyle;
}

interface Block {
  type: 'code' | 'text';
  language?: string;
  content: string;
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const CODE_FENCE_RE = /^```(\w+)?\s*$/;

export const MarkdownLite: React.FC<MarkdownLiteProps> = React.memo(({ text, baseStyle }) => {
  const { colors } = useTheme();

  const blocks = useMemo(() => {
    const result: Block[] = [];
    const lines = text.split('\n');
    let i = 0;
    let buffer: string[] = [];
    let codeLang: string | undefined;
    let inCode = false;

    const flush = () => {
      if (buffer.length > 0) {
        result.push({ type: 'text', content: buffer.join('\n') });
        buffer = [];
      }
    };

    while (i < lines.length) {
      const line = lines[i];
      const fenceMatch = line.match(CODE_FENCE_RE);

      if (!inCode && fenceMatch) {
        flush();
        inCode = true;
        codeLang = fenceMatch[1];
        i++;
        continue;
      }
      if (inCode && fenceMatch) {
        result.push({ type: 'code', language: codeLang, content: buffer.join('\n') });
        buffer = [];
        inCode = false;
        codeLang = undefined;
        i++;
        continue;
      }
      buffer.push(line);
      i++;
    }
    flush();
    if (inCode && buffer.length > 0) {
      result.push({ type: 'code', language: codeLang, content: buffer.join('\n') });
    }
    return result;
  }, [text]);

  const renderInline = (segment: string, key: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let lastIdx = 0;
    let match;
    let mIdx = 0;

    while ((match = regex.exec(segment)) !== null) {
      if (match.index > lastIdx) {
        parts.push(
          <Text key={`${key}-${mIdx++}`} style={baseStyle}>
            {segment.slice(lastIdx, match.index)}
          </Text>
        );
      }
      if (match[2]) {
        parts.push(
          <Text key={`${key}-${mIdx++}`} style={[baseStyle, styles.bold]}>
            {match[2]}
          </Text>
        );
      } else if (match[3]) {
        parts.push(
          <Text key={`${key}-${mIdx++}`} style={[baseStyle, styles.italic]}>
            {match[3]}
          </Text>
        );
      } else if (match[4]) {
        parts.push(
          <Text
            key={`${key}-${mIdx++}`}
            style={[
              baseStyle,
              styles.codeInline,
              {
                backgroundColor: colors.surface,
                color: colors.primary,
                fontFamily: 'monospace',
              },
            ]}
          >
            {match[4]}
          </Text>
        );
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < segment.length) {
      parts.push(
        <Text key={`${key}-${mIdx++}`} style={baseStyle}>
          {segment.slice(lastIdx)}
        </Text>
      );
    }
    return parts;
  };

  return (
    <View>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={`code-${idx}`}
              code={block.content}
              language={block.language}
            />
          );
        }
        const paragraphs = block.content.split(/\n{2,}/);
        return (
          <View key={`text-${idx}`} style={styles.paragraph}>
            {paragraphs.map((p, pIdx) => {
              const trimmed = p.trim();
              if (!trimmed) return null;
              const headingMatch = trimmed.match(HEADING_RE);
              if (headingMatch) {
                const level = headingMatch[1].length;
                const sizes = [24, 20, 18, 16, 15, 14];
                return (
                  <Text
                    key={pIdx}
                    style={[
                      baseStyle,
                      {
                        fontSize: sizes[level - 1] || FONT_SIZES.md,
                        fontWeight: FONT_WEIGHTS.black,
                        color: colors.text,
                        marginTop: SPACING.sm,
                      },
                    ]}
                  >
                    {renderInline(headingMatch[2], `h-${idx}-${pIdx}`)}
                  </Text>
                );
              }
              const isList = /^(\s*[-*]\s|\s*\d+\.\s)/m.test(trimmed);
              if (isList) {
                const items = trimmed.split('\n').filter((l) => l.trim());
                return (
                  <View key={pIdx} style={styles.list}>
                    {items.map((item, iIdx) => {
                      const cleaned = item.replace(/^\s*[-*]\s|^\s*\d+\.\s/, '');
                      const ordered = /^\s*\d+\.\s/.test(item);
                      return (
                        <View key={iIdx} style={styles.listItem}>
                          <Text
                            style={[
                              baseStyle,
                              { color: colors.primary, marginRight: 6 },
                            ]}
                          >
                            {ordered ? `${iIdx + 1}.` : '•'}
                          </Text>
                          <Text style={baseStyle} selectable>
                            {renderInline(cleaned, `l-${idx}-${pIdx}-${iIdx}`)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              }
              return (
                <Text key={pIdx} style={baseStyle} selectable>
                  {renderInline(trimmed, `p-${idx}-${pIdx}`)}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: SPACING.xs,
  },
  bold: {
    fontWeight: FONT_WEIGHTS.black,
  },
  italic: {
    fontStyle: 'italic',
  },
  codeInline: {
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: FONT_SIZES.sm,
  },
  list: {
    marginVertical: SPACING.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
});
