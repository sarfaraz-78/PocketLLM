import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelStore } from '../store/useModelStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { llamaEngine } from '../inference/LlamaEngine';
import { simpleTTS } from '../services/SimpleTTS';
import { getVoiceById } from '../services/VoiceManager';
import { AttachmentItem } from '../components/ChatInput';
import { VoicePicker } from '../components/VoicePicker';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { ModelStatusBar } from '../components/ModelStatusBar';
import { COLORS, SPACING } from '../theme';
import { ChatMessage } from '../types';

export const ChatScreen: React.FC = () => {
  const flatListRef = useRef<FlatList>(null);
  const {
    messages,
    isGenerating,
    addMessage,
    updateLastAssistantMessage,
    setGenerating,
    setLastStats,
    clearMessages,
  } = useChatStore();
  const { activeModel } = useModelStore();
  const { systemPrompt, completionSettings, darkMode, enableThinking, setEnableThinking, ttsVoiceId, setTTSVoiceId } = useSettingsStore();
  const { saveCurrentConversation } = useHistoryStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicePickerVisible, setVoicePickerVisible] = useState(false);

  const selectedVoice = getVoiceById(ttsVoiceId);

  // TTS is available when a model is loaded and there's an assistant message
  const hasAssistantMessage = messages.some((m) => m.role === 'assistant' && !m.isStreaming && m.content);
  const showTTS = llamaEngine.isLoaded() && hasAssistantMessage;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSpeak = async () => {
    if (isSpeaking) {
      simpleTTS.stop();
      setIsSpeaking(false);
      return;
    }

    if (!simpleTTS.isReady()) {
      Alert.alert('TTS Not Available', 'Text-to-Speech engine is not initialized.');
      return;
    }

    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && !m.isStreaming);

    if (lastAssistant?.content) {
      setIsSpeaking(true);
      simpleTTS.setVoice(ttsVoiceId);
      await simpleTTS.speak(lastAssistant.content);
      setIsSpeaking(false);
    }
  };

  const handleClear = () => {
    if (isSpeaking) {
      simpleTTS.stop();
      setIsSpeaking(false);
    }
    Alert.alert(
      'Clear Chat',
      'Delete all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearMessages(),
        },
      ]
    );
  };

  const handleSend = async (userMessage: string, attachments?: AttachmentItem[]) => {
    if (!activeModel || !llamaEngine.isLoaded()) {
      Alert.alert('No Model Loaded', 'Go to Models tab to load a GGUF file.');
      return;
    }

    const hasImages = attachments && attachments.some((a) => a.type === 'image');
    const imageAttachments = hasImages
      ? attachments!.filter((a) => a.type === 'image')
      : [];

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
      attachments: imageAttachments.length > 0 ? imageAttachments : undefined,
    };
    addMessage(userMsg);

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    addMessage(assistantMsg);

    setGenerating(true);

    try {
      const messageHistory = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage },
      ];

      let streamingText = '';

      const { text, stats } = await llamaEngine.sendMessage(
        messageHistory,
        completionSettings,
        (token) => {
          streamingText += token;
          updateLastAssistantMessage(streamingText, true);
        },
        imageAttachments,
        enableThinking
      );

      updateLastAssistantMessage(text, false, stats);
      setLastStats(stats);

      const finalMessages = useChatStore.getState().messages;
      await saveCurrentConversation(
        finalMessages,
        activeModel?.name || 'Unknown',
        activeModel?.id || 'unknown'
      );
    } catch (error) {
      updateLastAssistantMessage(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleStop = () => {
    llamaEngine.stopGeneration();
    setGenerating(false);
    updateLastAssistantMessage(
      messages[messages.length - 1]?.content || '',
      false
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
              <Icon name="trash-outline" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <ModelStatusBar
          activeModel={activeModel}
          lastStats={useChatStore.getState().lastStats}
          darkMode={darkMode}
        />
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '12' }]}>
              <Icon name="chatbubble-ellipses-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Load a model and type your first message below
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} darkMode={darkMode} />
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Bottom action bar: Thinking toggle + TTS */}
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: enableThinking ? colors.primary + '18' : colors.surfaceVariant },
            ]}
            onPress={() => setEnableThinking(!enableThinking)}
            activeOpacity={0.8}
          >
            <Icon
              name={enableThinking ? 'brain' : 'brain-outline'}
              size={16}
              color={enableThinking ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.actionText, { color: enableThinking ? colors.primary : colors.textSecondary }]}>
              Thinking
            </Text>
          </TouchableOpacity>

          {showTTS && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isSpeaking ? colors.primary + '18' : colors.surfaceVariant },
              ]}
              onPress={handleSpeak}
              activeOpacity={0.8}
            >
              <Icon
                name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={16}
                color={isSpeaking ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.actionText, { color: isSpeaking ? colors.primary : colors.textSecondary }]}>
                {isSpeaking ? 'Speaking...' : 'Read Aloud'}
              </Text>
            </TouchableOpacity>
          )}

          {showTTS && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.surfaceVariant },
              ]}
              onPress={() => setVoicePickerVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="mic-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {selectedVoice?.name || 'Voice'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <VoicePicker
          visible={voicePickerVisible}
          selectedVoiceId={ttsVoiceId}
          onSelect={setTTSVoiceId}
          onClose={() => setVoicePickerVisible(false)}
          darkMode={darkMode}
        />

        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          isGenerating={isGenerating}
          darkMode={darkMode}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  kavContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerBtn: {
    padding: SPACING.sm,
  },
  messageList: {
    paddingVertical: SPACING.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
