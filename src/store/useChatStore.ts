import { create } from 'zustand';
import { ChatMessage, GenerationStats } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  currentStreamingText: string;
  lastStats: GenerationStats | null;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string, isStreaming: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setCurrentStreamingText: (text: string) => void;
  setLastStats: (stats: GenerationStats) => void;
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

  updateLastAssistantMessage: (content, isStreaming) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content,
          isStreaming,
        };
      }
      return { messages };
    }),

  setGenerating: (generating) => set({ isGenerating: generating }),
  setCurrentStreamingText: (text) => set({ currentStreamingText: text }),
  setLastStats: (stats) => set({ lastStats: stats }),
  clearMessages: () => set({ messages: [], lastStats: null }),
}));
