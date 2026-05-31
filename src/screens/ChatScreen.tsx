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
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChatStore } from '../store/useChatStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useModelStore } from '../store/useModelStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { llamaEngine } from '../inference/LlamaEngine';
import { simpleTTS } from '../services/SimpleTTS';
import { getVoiceById } from '../services/VoiceManager';
import { VoicePicker } from '../components/VoicePicker';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput, AttachmentItem } from '../components/ChatInput';
import { ModelStatusBar } from '../components/ModelStatusBar';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';
import { ChatMessage } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getFileIconName = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js': return 'logo-javascript';
    case 'ts': return 'logo-typescript';
    case 'py': return 'logo-python';
    case 'md': return 'document-text';
    case 'json': return 'code-working';
    case 'html': return 'logo-html5';
    case 'css': return 'logo-css3';
    default: return 'document-outline';
  }
};

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
  const { files, workspaces, activeWorkspaceId } = useWorkspaceStore();
  const {
    systemPrompt,
    completionSettings,
    darkMode,
    enableThinking,
    codingMode,
    setEnableThinking,
    setCodingMode,
    ttsVoiceId,
    setTTSVoiceId,
  } = useSettingsStore();
  const { saveCurrentConversation } = useHistoryStore();
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicePickerVisible, setVoicePickerVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [agentIterations, setAgentIterations] = useState(0);
  const [filesChanged, setFilesChanged] = useState(0);

  const selectedVoice = getVoiceById(ttsVoiceId);
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
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.isStreaming);
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
    Alert.alert('Clear Chat', 'Delete all messages?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearMessages() },
    ]);
  };

  const handleSend = async (userMessage: string, attachments?: AttachmentItem[]) => {
    if (!activeModel || !llamaEngine.isLoaded()) {
      Alert.alert('No Model Loaded', 'Go to Models tab to load a GGUF file.');
      return;
    }

    const hasImages = attachments && attachments.some((a) => a.type === 'image');
    const imageAttachments = hasImages ? attachments!.filter((a) => a.type === 'image') : [];

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
      const codingModeTools = codingMode 
        ? '\n\n[OPENCODE AGENT SYSTEM]: You are an expert autonomous coding agent operating inside the user\'s ACTIVE workspace. ' +
          'You work like OpenCode — you understand the existing codebase before making changes.\n\n' +
          'WORKFLOW (follow this order):\n' +
          '1. UNDERSTAND: Start by calling `ide_list` to see all files, then `ide_read` on relevant files\n' +
          '2. PLAN: Briefly explain what you\'ll change and why\n' +
          '3. EDIT: Use `ide_patch` for surgical edits or `ide_write` for full rewrites. Use `ide_create` for new files\n' +
          '4. VERIFY: Run `terminal` commands (node, cat) to test your changes if applicable\n\n' +
          'CRITICAL RULES:\n' +
          '- NEVER create a new workspace unless the user explicitly asks for a new project\n' +
          '- ALWAYS read existing files before modifying them\n' +
          '- Prefer `ide_patch` over `ide_write` for targeted edits (preserves existing code)\n' +
          '- You can chain multiple tool calls in one response\n\n' +
          'Available Tools:\n' +
          '- `ide_list` (args: {}): List all files in workspace with line counts\n' +
          '- `ide_read` (args: { filename: string }): Read file with line numbers\n' +
          '- `ide_write` (args: { filename: string, content: string }): Overwrite/create file entirely\n' +
          '- `ide_create` (args: { filename: string, content: string }): Create new file (fails if exists)\n' +
          '- `ide_patch` (args: { filename: string, search: string, replace: string }): Find exact text in file and replace it (surgical edit)\n' +
          '- `ide_search` (args: { pattern: string, filename?: string }): Search/grep across files for a pattern\n' +
          '- `ide_delete` (args: { filename: string }): Delete a file\n' +
          '- `terminal` (args: { command: string }): Run shell commands (ls, cat, node <file>, git, echo, etc.)\n' +
          '- `browser_open` (args: { url: string }): Open URL in workspace browser\n' +
          '- `workspace_create` (args: { name: string, template?: string }): Create a NEW project (only when user asks!)\n' +
          '- `workspace_list` (args: {}): List all workspaces\n' +
          '- `workspace_switch` (args: { id: string }): Switch to another workspace\n\n' +
          'To call a tool, format it EXACTLY as:\n' +
          '```tool\n' +
          '{"tool": "tool_name", "args": {...}}\n' +
          '```\n' +
          'You can use multiple tool blocks in one response. After tools execute, you will receive their output and can continue working.'
        : '';

      let workspaceContext = '';
      if (codingMode) {
        const wsStore = useWorkspaceStore.getState();
        const currentWs = wsStore.workspaces.find(w => w.id === wsStore.activeWorkspaceId);
        const workspaceFiles = wsStore.files;
        const textFiles = workspaceFiles.filter((f) => f.type === 'file');
        
        workspaceContext = `\n\n[Active Workspace: "${currentWs?.name || 'Default Project'}"]\n`;
        if (textFiles.length > 0) {
          workspaceContext += `Files (${textFiles.length}):\n` + 
            textFiles.map((f) => {
              const lines = f.content ? f.content.split('\n').length : 0;
              const chars = f.content ? f.content.length : 0;
              return `  • ${f.name} (${lines} lines, ${chars} chars)`;
            }).join('\n') + '\n';
        } else {
          workspaceContext += 'Files: (empty workspace)\n';
        }
      }

      const messageHistory = [
        { role: 'system' as const, content: systemPrompt + codingModeTools + workspaceContext },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage },
      ];

      let streamingText = '';
      const codingSettings = codingMode ? { ...completionSettings, temperature: Math.min(completionSettings.temperature, 0.5) } : completionSettings;

      let fullResponse = '';
      const { text, stats } = await llamaEngine.sendMessage(
        messageHistory,
        codingSettings,
        (token) => {
          streamingText += token;
          fullResponse += token;
          updateLastAssistantMessage(streamingText, true);
        },
        imageAttachments,
        enableThinking
      );

      fullResponse = text;

      // Handle tool calls with agentic auto-continue loop
      const toolMatches = fullResponse.match(/```tool\n([\s\S]*?)\n```/g);
      if (toolMatches && codingMode) {
        let toolResultsText = '';
        let changedCount = 0;
        
        for (const match of toolMatches) {
          try {
            const jsonStr = match.replace(/```tool\n/, '').replace(/\n```/, '');
            const toolCall = JSON.parse(jsonStr);
            const result = llamaEngine.executeTool(toolCall.tool, toolCall.args);
            
            // Track file changes
            if (['ide_write', 'ide_create', 'ide_patch', 'ide_delete'].includes(toolCall.tool)) {
              changedCount++;
            }

            toolResultsText += `[${toolCall.tool}] ${result}\n\n`;

            // Add tool result as a visible message
            const toolResultMsg: ChatMessage = {
              id: (Date.now() + Math.random()).toString(),
              role: 'assistant',
              content: `⚙️ **${toolCall.tool}**${toolCall.args?.filename ? ` → ${toolCall.args.filename}` : ''}\n\`\`\`\n${result}\n\`\`\``,
              timestamp: Date.now(),
              isStreaming: false,
            };
            addMessage(toolResultMsg);
          } catch (e) {
            console.warn('Tool execution error:', e);
            toolResultsText += `[error] ${e}\n\n`;
          }
        }

        setFilesChanged(prev => prev + changedCount);

        // Remove tool blocks from displayed response
        const cleanText = fullResponse.replace(/```tool\n[\s\S]*?\n```/g, '').trim();
        updateLastAssistantMessage(cleanText || 'Tools executed.', false, stats);

        // Agentic auto-continue: feed tool results back and let model decide next steps
        let iteration = 0;
        const maxIterations = 5;
        let lastToolResults = toolResultsText;

        while (iteration < maxIterations && lastToolResults.trim()) {
          iteration++;
          setAgentIterations(iteration);

          // Build continuation prompt with tool results
          const continueMessages = [
            { role: 'system' as const, content: systemPrompt + codingModeTools + workspaceContext },
            ...useChatStore.getState().messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'system' as const, content: `[Tool Results]:\n${lastToolResults}\nContinue if more work is needed, or summarize what you did if complete. Do NOT repeat tool calls that already succeeded.` },
          ];

          // Create a new streaming assistant message for the continuation
          const continueMsg: ChatMessage = {
            id: (Date.now() + iteration + Math.random()).toString(),
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
            isStreaming: true,
          };
          addMessage(continueMsg);

          let continueStreaming = '';
          let continueResponse = '';
          try {
            const { text: cText, stats: cStats } = await llamaEngine.sendMessage(
              continueMessages,
              codingSettings,
              (token) => {
                continueStreaming += token;
                continueResponse += token;
                updateLastAssistantMessage(continueStreaming, true);
              },
              undefined,
              enableThinking
            );
            continueResponse = cText;

            // Check for more tool calls
            const newToolMatches = continueResponse.match(/```tool\n([\s\S]*?)\n```/g);
            if (newToolMatches) {
              lastToolResults = '';
              for (const match of newToolMatches) {
                try {
                  const jsonStr = match.replace(/```tool\n/, '').replace(/\n```/, '');
                  const toolCall = JSON.parse(jsonStr);
                  const result = llamaEngine.executeTool(toolCall.tool, toolCall.args);
                  
                  if (['ide_write', 'ide_create', 'ide_patch', 'ide_delete'].includes(toolCall.tool)) {
                    changedCount++;
                  }
                  lastToolResults += `[${toolCall.tool}] ${result}\n\n`;

                  const toolMsg: ChatMessage = {
                    id: (Date.now() + Math.random()).toString(),
                    role: 'assistant',
                    content: `⚙️ **${toolCall.tool}**${toolCall.args?.filename ? ` → ${toolCall.args.filename}` : ''}\n\`\`\`\n${result}\n\`\`\``,
                    timestamp: Date.now(),
                    isStreaming: false,
                  };
                  addMessage(toolMsg);
                } catch (e) {
                  console.warn('Tool execution error:', e);
                  lastToolResults += `[error] ${e}\n\n`;
                }
              }
              setFilesChanged(prev => prev + changedCount);

              const cleanContinue = continueResponse.replace(/```tool\n[\s\S]*?\n```/g, '').trim();
              updateLastAssistantMessage(cleanContinue || 'Continuing...', false, cStats);
            } else {
              // No more tool calls, agent is done
              updateLastAssistantMessage(continueResponse, false, cStats);
              lastToolResults = ''; // break the loop
            }
          } catch (err) {
            updateLastAssistantMessage(`Agent error: ${err instanceof Error ? err.message : 'Unknown'}`, false);
            lastToolResults = '';
          }
        }
        setAgentIterations(0);
      } else {
        updateLastAssistantMessage(fullResponse, false, stats);
      }

      setLastStats(stats);

      const finalMessages = useChatStore.getState().messages;
      await saveCurrentConversation(finalMessages, activeModel?.name || 'Unknown', activeModel?.id || 'unknown');
    } catch (error) {
      updateLastAssistantMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
    } finally {
      setGenerating(false);
    }
  };

  const handleStop = () => {
    llamaEngine.stopGeneration();
    setGenerating(false);
    updateLastAssistantMessage(messages[messages.length - 1]?.content || '', false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} darkMode={darkMode} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primary + '10' }]}>
        <Icon name="chatbubbles-outline" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Load a model and type your first message below
      </Text>
      {!activeModel && (
        <View style={[styles.emptyHint, { backgroundColor: colors.warning + '10' }]}>
          <Icon name="warning-outline" size={16} color={colors.warning} />
          <Text style={[styles.emptyHintText, { color: colors.warning }]}>
            No model loaded. Go to Models tab to load one.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
              {activeModel && (
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {activeModel.name}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {messages.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
                <Icon name="trash-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ModelStatusBar
          activeModel={activeModel}
          lastStats={useChatStore.getState().lastStats}
          darkMode={darkMode}
        />

        {codingMode && (
          <View style={[styles.hudContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.hudHeader}>
              <View style={styles.hudTitleRow}>
                <Icon name="terminal-outline" size={13} color={colors.primary} />
                <Text style={[styles.hudTitle, { color: colors.textSecondary }]}>OPENCODE AGENT</Text>
                {agentIterations > 0 && (
                  <View style={[styles.hudAgentBadge, { backgroundColor: colors.warning + '18' }]}>
                    <Text style={[styles.hudAgentText, { color: colors.warning }]}>thinking step {agentIterations}/5</Text>
                  </View>
                )}
              </View>
              <View style={styles.hudStatsRow}>
                {filesChanged > 0 && (
                  <View style={[styles.hudStatPill, { backgroundColor: colors.success + '14' }]}>
                    <Icon name="create-outline" size={10} color={colors.success} />
                    <Text style={[styles.hudStatText, { color: colors.success }]}>{filesChanged} changed</Text>
                  </View>
                )}
                <Text style={[styles.hudFileCount, { color: colors.textTertiary }]}>
                  {files.filter(f => f.type === 'file').length} files
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hudScroll}>
              {files.filter(f => f.type === 'file').map((file) => (
                <TouchableOpacity
                  key={file.id}
                  style={[styles.hudFileBadge, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => {
                    Alert.alert(
                      `File: ${file.name}`,
                      file.content ? file.content.substring(0, 1000) + (file.content.length > 1000 ? '\n\n... (truncated)' : '') : '(Empty File)',
                      [{ text: 'Close', style: 'cancel' }]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name={getFileIconName(file.name)} size={12} color={colors.primary} />
                  <Text style={[styles.hudFileName, { color: colors.text }]}>{file.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: codingMode ? colors.primary + '15' : colors.surfaceVariant },
            ]}
            onPress={() => setCodingMode(!codingMode)}
            activeOpacity={0.8}
          >
            <Icon
              name={codingMode ? 'code-slash' : 'code-slash-outline'}
              size={15}
              color={codingMode ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.actionText, { color: codingMode ? colors.primary : colors.textSecondary }]}>
              Coding Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: enableThinking ? colors.primary + '15' : colors.surfaceVariant },
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
                { backgroundColor: isSpeaking ? colors.primary + '15' : colors.surfaceVariant },
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
                {isSpeaking ? 'Speaking...' : 'Read'}
              </Text>
            </TouchableOpacity>
          )}

          {showTTS && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setVoicePickerVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="mic-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {selectedVoice?.name?.split(' ')[0] || 'Voice'}
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
  safeArea: { flex: 1 },
  kavContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  headerSubtitle: { fontSize: FONT_SIZES.xs, marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: SPACING.xs },
  headerBtn: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  messageList: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyHintText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
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
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  hudContainer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hudTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudFileCount: {
    fontSize: 9,
    fontWeight: '600',
  },
  hudScroll: {
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  hudFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  hudFileName: {
    fontSize: 11,
    fontWeight: '600',
  },
  hudStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hudStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  hudStatText: {
    fontSize: 9,
    fontWeight: '700',
  },
  hudAgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  hudAgentText: {
    fontSize: 9,
    fontWeight: '700',
  },
});