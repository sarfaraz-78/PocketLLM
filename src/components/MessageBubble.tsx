import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
            maxWidth: Dimensions.get('window').width * 0.8,
          },
        ]}
      >
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
            }}
          >
            {message.content}
          </Markdown>
        )}
        {message.isStreaming && (
          <Text style={[styles.streaming, { color: colors.textTertiary }]}>
            ●
          </Text>
        )}
      </View>
      {message.timings && !message.isStreaming && (
        <Text style={[styles.timings, { color: colors.textTertiary }]}>
          {message.timings.tokensPerSecond.toFixed(1)} tok/s ·{' '}
          {message.timings.totalTokens} tokens
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  text: {
    fontSize: FONT_SIZES.md,
    lineHeight: 20,
  },
  streaming: {
    fontSize: FONT_SIZES.lg,
    marginTop: SPACING.xs,
  },
  timings: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.sm,
  },
});
