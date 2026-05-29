import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  modelName: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

const CONVERSATIONS_KEY = '@pocketllm_conversations';
const MESSAGES_PREFIX = '@pocketllm_messages_';

export class Database {
  // Conversations
  static async getConversations(): Promise<Conversation[]> {
    const data = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static async saveConversation(conv: Conversation): Promise<void> {
    const conversations = await this.getConversations();
    const existingIndex = conversations.findIndex((c) => c.id === conv.id);
    if (existingIndex >= 0) {
      conversations[existingIndex] = conv;
    } else {
      conversations.unshift(conv);
    }
    await AsyncStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(conversations)
    );
  }

  static async deleteConversation(id: string): Promise<void> {
    const conversations = await this.getConversations();
    const filtered = conversations.filter((c) => c.id !== id);
    await AsyncStorage.setItem(
      CONVERSATIONS_KEY,
      JSON.stringify(filtered)
    );
    await AsyncStorage.removeItem(`${MESSAGES_PREFIX}${id}`);
  }

  static async searchConversations(query: string): Promise<Conversation[]> {
    const conversations = await this.getConversations();
    const lowerQuery = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.modelName.toLowerCase().includes(lowerQuery)
    );
  }

  // Messages
  static async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const data = await AsyncStorage.getItem(
      `${MESSAGES_PREFIX}${conversationId}`
    );
    return data ? JSON.parse(data) : [];
  }

  static async saveMessages(
    conversationId: string,
    messages: ChatMessage[]
  ): Promise<void> {
    await AsyncStorage.setItem(
      `${MESSAGES_PREFIX}${conversationId}`,
      JSON.stringify(messages)
    );
  }

  static async clearAll(): Promise<void> {
    const conversations = await this.getConversations();
    await AsyncStorage.removeItem(CONVERSATIONS_KEY);
    for (const conv of conversations) {
      await AsyncStorage.removeItem(`${MESSAGES_PREFIX}${conv.id}`);
    }
  }
}
