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
}

export const useChatStore = create<ChatState>((set) => ({
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
}));
