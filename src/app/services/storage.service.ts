import { Injectable } from '@angular/core';

export interface ConversationState {
  id: string;
  title: string;
  messages: any[];
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'pink' | 'pink2';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  apiUrl: string;
  lanMode: boolean;
  selectedModelId: string;
  reasoningEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly CONVERSATIONS_KEY = 'jan_conversations';
  private readonly SETTINGS_KEY = 'jan_settings';
  private readonly CURRENT_CONVERSATION_KEY = 'jan_current_conversation';

  private defaultSettings: AppSettings = {
    theme: 'dark',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: 'You are a helpful AI assistant.',
    apiUrl: '/api',
    lanMode: false,
    selectedModelId: '',
    reasoningEnabled: true
  };

  constructor() {}

  // Conversation methods
  saveConversation(conversation: ConversationState): void {
    const conversations = this.getAllConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    conversation.updatedAt = Date.now();
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations));
  }

  getAllConversations(): ConversationState[] {
    const data = localStorage.getItem(this.CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getConversation(id: string): ConversationState | null {
    const conversations = this.getAllConversations();
    return conversations.find(c => c.id === id) || null;
  }

  deleteConversation(id: string): void {
    const conversations = this.getAllConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(filtered));
    
    // Clear current conversation if it was deleted
    if (this.getCurrentConversationId() === id) {
      this.clearCurrentConversation();
    }
  }

  setCurrentConversation(id: string): void {
    localStorage.setItem(this.CURRENT_CONVERSATION_KEY, id);
  }

  getCurrentConversationId(): string | null {
    return localStorage.getItem(this.CURRENT_CONVERSATION_KEY);
  }

  clearCurrentConversation(): void {
    localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }

  // Settings methods
  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
  }

  getSettings(): AppSettings {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    return data ? { ...this.defaultSettings, ...JSON.parse(data) } : this.defaultSettings;
  }

  resetSettings(): void {
    localStorage.removeItem(this.SETTINGS_KEY);
  }

  clearAll(): void {
    localStorage.removeItem(this.CONVERSATIONS_KEY);
    localStorage.removeItem(this.SETTINGS_KEY);
    localStorage.removeItem(this.CURRENT_CONVERSATION_KEY);
  }
}
