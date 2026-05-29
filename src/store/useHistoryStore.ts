import { create } from 'zustand';
import { ChatMessage } from '../types';
import { Database, Conversation } from '../services/Database';

interface HistoryState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  startNewConversation: () => void;
  loadConversation: (id: string) => Promise<ChatMessage[]>;
  saveCurrentConversation: (
    messages: ChatMessage[],
    modelName: string,
    modelId: string
  ) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  searchConversations: (query: string) => Promise<Conversation[]>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,

  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await Database.getConversations();
      set({ conversations });
    } finally {
      set({ isLoading: false });
    }
  },

  startNewConversation: () => {
    set({ currentConversationId: null });
  },

  loadConversation: async (id: string) => {
    set({ currentConversationId: id });
    return await Database.getMessages(id);
  },

  saveCurrentConversation: async (
    messages: ChatMessage[],
    modelName: string,
    modelId: string
  ) => {
    if (messages.length === 0) return;

    const id =
      get().currentConversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate title from first user message
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 40) +
        (firstUserMsg.content.length > 40 ? '...' : '')
      : 'New Conversation';

    const conversation: Conversation = {
      id,
      title,
      modelId,
      modelName: modelName || 'Unknown Model',
      createdAt: get().currentConversationId
        ? get().conversations.find((c) => c.id === id)?.createdAt || Date.now()
        : Date.now(),
      updatedAt: Date.now(),
      messageCount: messages.length,
    };

    await Database.saveConversation(conversation);
    await Database.saveMessages(id, messages);

    set({ currentConversationId: id });
    await get().loadConversations();
  },

  deleteConversation: async (id: string) => {
    await Database.deleteConversation(id);
    if (get().currentConversationId === id) {
      set({ currentConversationId: null });
    }
    await get().loadConversations();
  },

  searchConversations: async (query: string) => {
    return await Database.searchConversations(query);
  },
}));
