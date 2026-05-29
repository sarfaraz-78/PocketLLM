import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { ChatMessage } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import Markdown from 'react-native-markdown-display';

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
        {/* Image attachments */}
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
            {message.content || ' '}
          </Markdown>
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
});
