import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageBubbleProps {
  message: ChatMessage;
  darkMode: boolean;
}

const THINK_REGEX = /<think>([\s\S]*?)<\/think>/gi;
const THINK_REGEX_ALT = /<think>([\s\S]*?)<\/think>/gi;

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  darkMode,
}) => {
  const isUser = message.role === 'user';
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const attachments = message.attachments || [];
  const [showThinking, setShowThinking] = useState(false);

  const content = message.content || ' ';

  let thinkingContent = '';
  let responseContent = content;

  const thinkMatch = content.match(THINK_REGEX);
  if (thinkMatch && thinkMatch.length > 0) {
    const fullThink = thinkMatch[0];
    thinkingContent = fullThink
      .replace(/<think>/gi, '')
      .replace(/<\/think>/gi, '')
      .trim();
    responseContent = content.replace(fullThink, '').trim();
  }

  const hasThinking = thinkingContent.length > 0;

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser
              ? colors.userBubble
              : colors.assistantBubble,
            borderBottomLeftRadius: isUser ? BORDER_RADIUS.lg : BORDER_RADIUS.sm,
            borderBottomRightRadius: isUser ? BORDER_RADIUS.sm : BORDER_RADIUS.lg,
          },
        ]}
      >
        {attachments.filter((a) => a.type === 'image').length > 0 && (
          <View style={styles.attachmentsRow}>
            {attachments
              .filter((a) => a.type === 'image')
              .map((att, idx) => (
                <Image
                  key={idx}
                  source={{ uri: att.uri }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ))}
          </View>
        )}

        {isUser ? (
          <Text
            style={[styles.text, { color: colors.userBubbleText }]}
          >
            {message.content}
          </Text>
        ) : (
          <>
            {hasThinking && !showThinking && (
              <TouchableOpacity
                style={[styles.thinkingToggle, { backgroundColor: colors.primary + '15' }]}
                onPress={() => setShowThinking(true)}
                activeOpacity={0.7}
              >
                <Icon name="bulb-outline" size={14} color={colors.primary} />
                <Text style={[styles.thinkingToggleText, { color: colors.primary }]}>
                  Show thinking ({thinkingContent.length} chars)
                </Text>
              </TouchableOpacity>
            )}

            {hasThinking && showThinking && (
              <View style={styles.thinkingSection}>
                <TouchableOpacity
                  style={[styles.thinkingToggle, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => setShowThinking(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="bulb" size={14} color={colors.primary} />
                  <Text style={[styles.thinkingToggleText, { color: colors.primary }]}>
                    Hide thinking
                  </Text>
                </TouchableOpacity>
                <View style={[styles.thinkingContent, { backgroundColor: colors.primary + '08' }]}>
                  <Text style={[styles.thinkingLabel, { color: colors.primary }]}>
                    Thoughts
                  </Text>
                  <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
                    {thinkingContent}
                  </Text>
                </View>
              </View>
            )}

            <Markdown
              style={{
                body: {
                  color: colors.assistantBubbleText,
                  fontSize: FONT_SIZES.md,
                },
                paragraph: {
                  marginBottom: 4,
                },
                code_inline: {
                  backgroundColor: darkMode ? '#1E293B' : '#E2E8F0',
                  color: darkMode ? '#F8FAFC' : '#0F172A',
                  borderRadius: BORDER_RADIUS.sm,
                  paddingHorizontal: 4,
                  fontFamily: 'monospace',
                },
                fence: {
                  backgroundColor: darkMode ? '#1E293B' : '#E2E8F0',
                  borderRadius: BORDER_RADIUS.md,
                  padding: SPACING.md,
                  color: darkMode ? '#F8FAFC' : '#0F172A',
                  fontFamily: 'monospace',
                },
              }}
            >
              {responseContent || ' '}
            </Markdown>
          </>
        )}
        {message.isStreaming && (
          <View style={styles.typingIndicator}>
            <Text style={[styles.streamingDot, { color: colors.primary }]}>
              ●
            </Text>
          </View>
        )}
      </View>
      {message.timings && !message.isStreaming && (
        <Text style={[styles.timings, { color: colors.textTertiary }]}>
          {message.timings.tokensPerSecond.toFixed(1)} tok/s ·{' '}
          {message.timings.totalTokens} tokens · {message.timings.promptPerSecond?.toFixed(1) || '?'} prompt/s
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    maxWidth: Dimensions.get('window').width * 0.85,
    flexShrink: 0,
  },
  text: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  typingIndicator: {
    marginTop: SPACING.xs,
  },
  streamingDot: {
    fontSize: FONT_SIZES.sm,
  },
  timings: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.sm,
  },
  attachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.md,
  },
  thinkingSection: {
    marginBottom: SPACING.sm,
  },
  thinkingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  thinkingToggleText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  thinkingContent: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  thinkingLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thinkingText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
});
