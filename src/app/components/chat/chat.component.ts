import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { ChatService, Message, Model, RequestStatus, ConnectionStatus } from '../../services/chat.service';
import { StorageService, ConversationState, AppSettings } from '../../services/storage.service';
import { SavedPromptsService, SavedPrompt } from '../../services/saved-prompts.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages$ = this.chatService.messages$;
  generating$ = this.chatService.generating$;
  requestStatus$ = this.chatService.requestStatus$;
  connectionStatus$ = this.chatService.connectionStatus$;

  messages: Message[] = [];
  inputText = '';
  attachedImages: string[] = [];
  currentModel: Model | null = null;
  selectedModelId = '';
  models: Model[] = [];
  settings: AppSettings;
  
  showSettings = false;
  showHistory = false;
  conversations: ConversationState[] = [];
  currentConversationId: string | null = null;

  // Saved prompts
  savedPrompts: SavedPrompt[] = [];

  shouldScroll = true;
  private hasInitializedView = false;
  private statusPoller?: number;
  private readonly bottomScrollThreshold = 4;

  constructor(
    private chatService: ChatService,
    private storageService: StorageService,
    private savedPromptsService: SavedPromptsService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.settings = this.storageService.getSettings();
  }

  private applyTheme(theme: AppSettings['theme']): void {
    document.documentElement.setAttribute('data-theme', theme);
    this.settings = { ...this.settings, theme };
  }

  ngOnInit(): void {
    // Load settings
    this.settings = this.storageService.getSettings();
    this.selectedModelId = this.settings.selectedModelId || '';
    this.chatService.setApiUrl(this.settings.apiUrl);
    this.applyTheme(this.settings.theme);

    // Load saved prompts
    this.savedPrompts = this.savedPromptsService.getSavedPrompts();

    // Subscribe to messages
    this.messages$.subscribe(messages => {
      const previousCount = this.messages.length;
      this.messages = messages;
      this.cdr.markForCheck();  // Trigger change detection for OnPush strategy

      if (this.shouldScroll || messages.length > previousCount) {
        this.scrollToBottom();
      }
    });

    // Load conversations
    this.loadConversations();

    // Load current conversation
    const conversationId = this.storageService.getCurrentConversationId();
    if (conversationId) {
      this.loadConversation(conversationId);
    }

    // Fetch models
    this.fetchModels();

    // Check connection periodically and re-enter Angular so the async status updates trigger the UI.
    this.statusPoller = window.setInterval(() => {
      this.ngZone.run(() => {
        this.chatService.checkConnection();
      });
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.statusPoller) {
      clearInterval(this.statusPoller);
    }
  }

  ngAfterViewChecked(): void {
    if (!this.hasInitializedView && this.messagesContainer) {
      this.hasInitializedView = true;
      this.scrollToBottom();
      return;
    }

    if (this.shouldScroll && this.messagesContainer) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement as HTMLElement;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        if (this.shouldScroll || distanceFromBottom <= this.bottomScrollThreshold) {
          container.scrollTop = container.scrollHeight;
        }
      }
    } catch (e) {
      console.error('Error scrolling to bottom:', e);
    }
  }

  onMessagesScroll(): void {
    if (!this.messagesContainer) {
      return;
    }

    const container = this.messagesContainer.nativeElement as HTMLElement;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    this.shouldScroll = distanceFromBottom <= this.bottomScrollThreshold;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id || `${index}`;
  }

  trackByConversationId(index: number, conversation: ConversationState): string {
    return conversation.id || `${index}`;
  }

  private applySelectedModel(model: Model | null): void {
    this.currentModel = model;
    this.selectedModelId = model?.id || '';
    this.chatService.setCurrentModel(model);
    this.storageService.saveSettings({ ...this.settings, selectedModelId: this.selectedModelId });
    this.settings = this.storageService.getSettings();
    this.cdr.markForCheck();
  }

  fetchModels(): void {
    this.chatService.fetchModels().subscribe({
      next: (response: any) => {
        this.models = response?.data || [];

        if (this.models.length === 0) {
          this.currentModel = null;
          this.selectedModelId = '';
          return;
        }

        const conversationModelId = this.currentConversationId
          ? this.storageService.getConversation(this.currentConversationId)?.model
          : null;
        const preferredModelId = conversationModelId || this.settings.selectedModelId || this.selectedModelId;
        const selected = this.models.find(model => model.id === preferredModelId)
          || this.models[0];

        this.applySelectedModel(selected);
      },
      error: (e) => {
        console.error('Error fetching models:', e);
      }
    });
  }

  async sendMessage(): Promise<void> {
    const hasText = this.inputText.trim().length > 0;
    const hasImages = this.attachedImages.length > 0;

    if ((!hasText && !hasImages) || !this.currentModel) {
      return;
    }

    const message = this.inputText.trim();
    const imagesToSend = [...this.attachedImages];
    this.inputText = '';
    this.attachedImages = [];
    this.shouldScroll = true;

    await this.chatService.sendMessage(
      message,
      this.currentModel.id,
      this.settings.systemPrompt,
      this.settings.temperature,
      this.settings.maxTokens,
      imagesToSend,
      this.settings.reasoningEnabled
    );

    // Auto-save conversation
    this.saveCurrentConversation();
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.length === 0) {
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result) {
          this.attachedImages = [...this.attachedImages, result];
          this.cdr.markForCheck();  // Trigger change detection
        }
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeAttachedImage(index: number): void {
    this.attachedImages = this.attachedImages.filter((_, i) => i !== index);
  }

  onEditMessage(editedContent: string, index: number): void {
    const messages = this.messages;
    if (index >= 0 && index < messages.length) {
      messages[index].content = editedContent;
      this.chatService.setMessages([...messages]);
      this.saveCurrentConversation();
    }
  }

  onRegenerateResponse(index: number): void {
    // Find the user message before this assistant message
    let userMessageIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex >= 0) {
      // Remove messages from the user message onwards
      const userMessage = this.messages[userMessageIndex].content;
      this.chatService.setMessages(this.messages.slice(0, userMessageIndex));
      
      // Re-send
      this.inputText = userMessage;
      this.sendMessage();
    }
  }

  onDeleteMessage(index: number): void {
    const messages = this.messages;
    messages.splice(index, 1);
    this.chatService.setMessages([...messages]);
    this.saveCurrentConversation();
  }

  newChat(): void {
    this.shouldScroll = true;
    this.chatService.clearMessages();
    this.storageService.clearCurrentConversation();
    this.currentConversationId = null;
    this.loadConversations();
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  closeSettings(): void {
    this.showSettings = false;
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  onSettingsChange(newSettings: AppSettings): void {
    const previousApiUrl = this.settings.apiUrl;
    const effectiveApiUrl = '/api';

    this.settings = { ...newSettings, apiUrl: effectiveApiUrl };
    this.storageService.saveSettings(this.settings);
    this.applyTheme(this.settings.theme);

    if (previousApiUrl !== effectiveApiUrl) {
      this.chatService.setApiUrl(effectiveApiUrl);
      this.fetchModels();
    }
  }

  selectSavedPrompt(prompt: SavedPrompt): void {
    this.settings = { ...this.settings, systemPrompt: prompt.prompt, promptTitle:prompt.name };
    this.storageService.saveSettings(this.settings);
    this.savedPrompts = this.savedPromptsService.getSavedPrompts();
    this.cdr.markForCheck();
  }

  onModelChange(modelId: string): void {
    const model = this.models.find(item => item.id === modelId) || null;
    this.applySelectedModel(model);
  }

  selectModel(model: Model): void {
    this.applySelectedModel(model);
  }

  saveCurrentConversation(): void {
    if (!this.currentConversationId) {
      this.currentConversationId = 'conv_' + Date.now();
      this.storageService.setCurrentConversation(this.currentConversationId);
    }

    const title = this.messages.length > 0 
      ? this.messages[0].content.substring(0, 50) 
      : 'New Conversation';

    const persistedMessages = this.messages.map(({ reasoningContent, ...message }) => message);

    const conversation: ConversationState = {
      id: this.currentConversationId,
      title,
      messages: persistedMessages,
      model: this.currentModel?.id || '',
      temperature: this.settings.temperature,
      maxTokens: this.settings.maxTokens,
      systemPrompt: this.settings.systemPrompt,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.storageService.saveConversation(conversation);
    this.loadConversations();
  }

  loadConversations(): void {
    this.conversations = this.storageService.getAllConversations()
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  loadConversation(id: string): void {
    const conversation = this.storageService.getConversation(id);
    if (conversation) {
      this.shouldScroll = true;
      this.chatService.setMessages(conversation.messages);
      this.currentConversationId = id;
      this.storageService.setCurrentConversation(id);
      
      // Restore settings
      this.settings = {
        ...this.settings,
        temperature: conversation.temperature,
        maxTokens: conversation.maxTokens,
        systemPrompt: conversation.systemPrompt
      };

      // Find and select the model
      const model = this.models.find(m => m.id === conversation.model);
      if (model) {
        this.currentModel = model;
      }

      this.showHistory = false;
    }
  }

  deleteConversation(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Delete this conversation?')) {
      this.storageService.deleteConversation(id);
      this.loadConversations();
      if (this.currentConversationId === id) {
        this.newChat();
      }
    }
  }

  getFormattedDate(timestamp: number): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString();
  }

  stopGeneration(): void {
    this.chatService.stopGeneration();
  }

  getRequestStatusLabel(requestStatus: RequestStatus | null, connectionStatus: ConnectionStatus | null): string {
    if (requestStatus === 'generating') {
      return 'Generating response…';
    }

    if (requestStatus === 'waiting') {
      return 'Waiting for backend…';
    }

    if (requestStatus === 'checking') {
      return 'Checking backend…';
    }

    switch (connectionStatus) {
      case 'checking':
        return 'Checking backend…';
      case 'connected':
        return 'Backend connected';
      case 'error':
        return 'Backend error';
      case 'disconnected':
      default:
        return 'Backend disconnected';
    }
  }

  getModelContextInfo(model: Model | null): string {
    if (!model) {
      return 'Context: N/A | Max output: N/A';
    }

    const contextValue = model.ctx_len ?? model.context_length ?? 'N/A';
    const outputValue = model.max_tokens ?? model.max_output_tokens ?? 'N/A';

    return `Context: ${contextValue === 'N/A' ? 'N/A' : `${contextValue} tokens`} | Max output: ${outputValue === 'N/A' ? 'N/A' : `${outputValue} tokens`}`;
  }

  onPromptSelect(promptText: string): void {
    if (!promptText) return;
    
    const prompt = this.savedPrompts.find(p => p.prompt === promptText);
    if (prompt) {
      this.selectSavedPrompt(prompt);
    }
  }

  getSelectedPromptName(): string {
    const prompt = this.savedPrompts.find(p => p.prompt === this.settings.systemPrompt);
    return prompt ? prompt.name : 'Custom';
  }

  copyMessage(index: number): void {
    const message = this.messages[index];
    navigator.clipboard.writeText(message.content).then(() => {
      alert('Message copied to clipboard');
    });
  }
}
