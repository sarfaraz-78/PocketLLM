import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { ChatMessage } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageBubbleProps {
  message: ChatMessage;
  darkMode: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  darkMode,
}) => {
  const isUser = message.role === 'user';
  const colors = darkMode ? COLORS.dark : COLORS.light;
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
    borderRadius: BORDER_RADIUS.sm,
  },
});
