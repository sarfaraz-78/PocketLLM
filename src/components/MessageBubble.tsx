import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ChatMessage } from '../types';
import { useTheme } from '../hooks/useTheme';
import { SPACING, FONT_SIZES, RADIUS } from '../theme/tokens';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageBubbleProps {
  message: ChatMessage;
  darkMode: boolean;
}

const MessageBubbleBase: React.FC<MessageBubbleProps> = ({
  message,
  darkMode: _darkMode,
}) => {
  const { colors, isDark } = useTheme();
  const isUser = message.role === 'user';
  const attachments = message.attachments || [];
  const [showThinking, setShowThinking] = useState(true); // Default to showing thinking so it streams beautifully

  const content = message.content || ' ';

  let thinkingContent = '';
  let responseContent = content;
  let isThinkingActive = false;

  if (content.includes('<think>')) {
    const parts = content.split('<think>');
    const thinkBody = parts[1] || '';
    
    if (thinkBody.includes('</think>')) {
      const subParts = thinkBody.split('</think>');
      thinkingContent = subParts[0].trim();
      responseContent = (parts[0] + (subParts[1] || '')).trim();
    } else {
      // Actively thinking (no closing tag yet)
      thinkingContent = thinkBody.trim();
      responseContent = parts[0].trim();
      isThinkingActive = true;
    }
  }

  const hasThinking = thinkingContent.length > 0 || isThinkingActive;

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
            borderColor: isUser ? 'transparent' : colors.glassBorder,
            borderWidth: isUser ? 0 : 1,
            borderBottomLeftRadius: isUser ? RADIUS.lg : RADIUS.sm,
            borderBottomRightRadius: isUser ? RADIUS.sm : RADIUS.lg,
            shadowColor: isUser ? colors.glow : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isUser ? 0.35 : 0,
            shadowRadius: 12,
            elevation: isUser ? 4 : 0,
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
                  {isThinkingActive ? 'Thinking in progress...' : `Show thoughts (${thinkingContent.length} chars)`}
                </Text>
                {isThinkingActive && <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />}
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
                    Hide thoughts
                  </Text>
                </TouchableOpacity>
                <View style={[styles.thinkingContent, { backgroundColor: colors.primary + '08' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[styles.thinkingLabel, { color: colors.primary }]}>
                      Thinking Process
                    </Text>
                    {isThinkingActive && (
                      <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '800', letterSpacing: 0.5 }}>
                        ⚡ ACTIVE THINKING
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
                    {thinkingContent || 'Formulating reasoning...'}
                  </Text>
                </View>
              </View>
            )}

            <Markdown
              style={{
                body: {
                  color: colors.assistantBubbleText,
                  fontSize: FONT_SIZES.base,
                  lineHeight: 22,
                },
                paragraph: {
                  marginBottom: 6,
                },
                code_inline: {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.10)',
                  color: isDark ? colors.text : '#1E1B4B',
                  borderRadius: RADIUS.xs,
                  paddingHorizontal: 5,
                  fontFamily: 'monospace',
                },
                fence: {
                  backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(99,102,241,0.06)',
                  borderRadius: RADIUS.md,
                  padding: SPACING.md,
                  color: isDark ? colors.text : '#1E1B4B',
                  fontFamily: 'monospace',
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                },
              }}
            >
              {responseContent || ' '}
            </Markdown>
            {!isUser && responseContent && (
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: colors.primary + '10' }]}
                onPress={() => {
                  Clipboard.setString(responseContent);
                  Alert.alert('Copied', 'Response copied to clipboard');
                }}
                activeOpacity={0.7}
              >
                <Icon name="copy-outline" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
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

const areMessagesEqual = (
  prev: MessageBubbleProps,
  next: MessageBubbleProps
): boolean => {
  return (
    prev.message === next.message &&
    prev.message.content === next.message.content &&
    prev.message.isStreaming === next.message.isStreaming &&
    prev.message.role === next.message.role &&
    prev.message.timings === next.message.timings &&
    prev.darkMode === next.darkMode
  );
};

export const MessageBubble = React.memo(MessageBubbleBase, areMessagesEqual);

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
    borderRadius: RADIUS.lg,
    width: '80%',
    maxWidth: 320,
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
    borderRadius: RADIUS.md,
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
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  thinkingToggleText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  thinkingContent: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
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
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  copyButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
});
