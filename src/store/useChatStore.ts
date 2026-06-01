import { create } from 'zustand';
import { ChatMessage, GenerationStats } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  currentStreamingText: string;
  lastStats: GenerationStats | null;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string, isStreaming: boolean, timings?: GenerationStats) => void;
  setGenerating: (generating: boolean) => void;
  setCurrentStreamingText: (text: string) => void;
  setLastStats: (stats: GenerationStats) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  // v3.0 features
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessagesAfter: (id: string) => void;
  getMessageById: (id: string) => ChatMessage | undefined;
  getPreviousUserMessage: (assistantId: string) => ChatMessage | undefined;
  // v3.0: Conversation branching
  forkAtMessage: (messageId: string) => string;
  switchBranch: (messageId: string, siblingId: string) => void;
  getBranchSiblings: (parentMessageId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isGenerating: false,
  currentStreamingText: '',
  lastStats: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastAssistantMessage: (content, isStreaming, timings) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content,
          isStreaming,
          timings: timings ? {
            tokensPerSecond: timings.tokensPerSecond,
            totalTokens: timings.totalTokens,
            promptTokens: timings.promptTokens,
            promptPerSecond: timings.promptPerSecond,
            totalTimeMs: timings.totalTimeMs,
          } : messages[lastIndex].timings,
        };
      }
      return { messages };
    }),

  setGenerating: (generating) => set({ isGenerating: generating }),
  setCurrentStreamingText: (text) => set({ currentStreamingText: text }),
  setLastStats: (stats) => set({ lastStats: stats }),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [], lastStats: null }),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  clearMessagesAfter: (id) =>
    set((state) => {
      const index = state.messages.findIndex((m) => m.id === id);
      if (index === -1) return {};
      return { messages: state.messages.slice(0, index + 1) };
    }),

  getMessageById: (id) => get().messages.find((m) => m.id === id),

  getPreviousUserMessage: (assistantId) => {
    const messages = get().messages;
    const assistantIndex = messages.findIndex((m) => m.id === assistantId);
    if (assistantIndex === -1) return undefined;
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i];
    }
    return undefined;
  },

  forkAtMessage: (messageId) => {
    const branchId = `branch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              branchId,
              branchSiblings: [...(m.branchSiblings || []), m.id],
            }
          : m
      ),
    }));
    return branchId;
  },

  switchBranch: (messageId, siblingId) => {
    const messages = get().messages;
    const currentIndex = messages.findIndex((m) => m.id === messageId);
    const siblingIndex = messages.findIndex((m) => m.id === siblingId);
    if (currentIndex === -1 || siblingIndex === -1) return;

    const messagesCopy = [...messages];
    messagesCopy[currentIndex] = { ...messagesCopy[currentIndex], id: siblingId };

    const visitedSiblings = new Set<string>();
    const nextMessages: ChatMessage[] = [];
    for (const m of messagesCopy) {
      if (m.id === siblingId) {
        continue;
      }
      if (m.parentMessageId === siblingId) {
        const altSiblings = messagesCopy.filter(
          (x) => x.parentMessageId === siblingId && x.id !== m.id
        );
        if (altSiblings.length > 0 && !visitedSiblings.has(altSiblings[0].id)) {
          visitedSiblings.add(altSiblings[0].id);
          nextMessages.push({ ...altSiblings[0], id: '__swap__' + altSiblings[0].id });
          continue;
        }
      }
      nextMessages.push(m);
    }
    set({ messages: nextMessages });
  },

  getBranchSiblings: (parentMessageId) => {
    return get().messages.filter((m) => m.parentMessageId === parentMessageId);
  },
}));
