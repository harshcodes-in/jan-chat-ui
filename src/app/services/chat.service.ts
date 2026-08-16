import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  timestamp: number;
  images?: string[];
  tokens?: {
    input: number;
    output: number;
  };
}

export interface ChatCompletion {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface Model {
  id: string;
  name: string;
  object: string;
  created: number;
  owned_by?: string;
  description?: string;
  ctx_len?: number;
  context_length?: number;
  max_tokens?: number;
  max_output_tokens?: number;
  temperature?: number;
  prompt_template?: string;
}

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';
export type RequestStatus = 'idle' | 'checking' | 'generating' | 'waiting' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = '/api';
  private messageSubject = new BehaviorSubject<Message[]>([]);
  private generatingSubject = new BehaviorSubject<boolean>(false);
  private requestStatusSubject = new BehaviorSubject<RequestStatus>('idle');
  private stopGenerationSubject = new Subject<void>();
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('checking');

  public messages$ = this.messageSubject.asObservable();
  public generating$ = this.generatingSubject.asObservable();
  public requestStatus$ = this.requestStatusSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private currentModel: Model | null = null;
  private reasoningEnabled = true;

  constructor(private http: HttpClient) {
    this.checkConnection();
  }

  setApiUrl(apiUrl: string): void {
    // The browser talks to the local Angular dev server through /api.
    // The proxy then forwards /api -> http://127.0.0.1:1337/v1.
    void apiUrl;
  }

  checkConnection(): void {
    this.connectionStatusSubject.next('checking');
    this.requestStatusSubject.next('checking');

    this.http.get<any>(`${this.apiUrl}/models`).subscribe({
      next: () => {
        this.connectionStatusSubject.next('connected');
        this.requestStatusSubject.next(this.generatingSubject.value ? 'generating' : 'idle');
      },
      error: () => {
        this.connectionStatusSubject.next('disconnected');
        this.requestStatusSubject.next('error');
      }
    });
  }

  getMessages(): Message[] {
    return this.messageSubject.value;
  }

  setMessages(messages: Message[]): void {
    this.messageSubject.next(messages);
  }

  addMessage(message: Message): void {
    const messages = this.messageSubject.value;
    this.messageSubject.next([...messages, message]);
  }

  updateLastMessage(content: string): void {
    const messages = this.messageSubject.value;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const updatedMessages = [...messages];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content
      };
      this.messageSubject.next(updatedMessages);
    }
  }

  appendToLastMessage(content?: string, reasoningContent?: string): void {
    const messages = this.messageSubject.value;
    if (messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') {
      return;
    }

    const nextContent = content ? (lastMessage.content || '') + content : lastMessage.content || '';
    const nextReasoningContent = reasoningContent
      ? (lastMessage.reasoningContent || '') + reasoningContent
      : lastMessage.reasoningContent || '';

    const updatedMessages = [...messages];
    updatedMessages[updatedMessages.length - 1] = {
      ...lastMessage,
      content: nextContent,
      reasoningContent: nextReasoningContent
    };
    this.messageSubject.next(updatedMessages);
  }

  getCurrentModel(): Model | null {
    return this.currentModel;
  }

  setCurrentModel(model: Model | null): void {
    this.currentModel = model;
  }

  private stripTransientReasoning(messages: Message[]): Message[] {
    return messages.map(({ reasoningContent, ...rest }) => rest as Message);
  }

  private toOpenAiMessages(messages: Message[], systemPrompt: string): Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> {
    const sanitizedMessages = this.stripTransientReasoning(messages);

    const formattedMessages = sanitizedMessages
      .filter(message => message.role !== 'system' && !(message.role === 'assistant' && !message.content.trim()))
      .map(message => {
        const baseContent = message.content || '';

        if (message.images && message.images.length > 0) {
          return {
            role: message.role,
            content: [
              { type: 'text', text: baseContent },
              ...message.images.map(image => ({
                type: 'image_url',
                image_url: { url: image }
              }))
            ]
          };
        }

        return {
          role: message.role,
          content: baseContent
        };
      });

    if (systemPrompt) {
      formattedMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    return formattedMessages;
  }

  private async streamChatCompletion(
    model: string,
    messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
    temperature: number,
    maxTokens: number,
    reasoningEnabled: boolean = true
  ): Promise<void> {
    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        reasoning: reasoningEnabled,
        enable_thinking: reasoningEnabled,
        reasoning_effort: reasoningEnabled ? 'medium' : 'none'
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Streaming response is not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        const trimmedChunk = chunk.trim();
        if (!trimmedChunk || !trimmedChunk.startsWith('data:')) {
          continue;
        }

        const rawData = trimmedChunk.replace(/^data:\s*/, '').trim();
        if (!rawData || rawData === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(rawData) as any;
          const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.message?.content ?? '';
          const reasoningDelta = parsed?.choices?.[0]?.delta?.reasoning_content
            ?? parsed?.choices?.[0]?.message?.reasoning_content
            ?? parsed?.reasoning_content
            ?? '';
          const usage = parsed?.usage;

          if (reasoningDelta) {
            this.appendToLastMessage(undefined, reasoningDelta);
          }

          if (delta) {
            this.appendToLastMessage(delta);
          }

          if (usage && this.messageSubject.value.length > 0) {
            const lastMessage = this.messageSubject.value[this.messageSubject.value.length - 1];
            const updatedMessages = [...this.messageSubject.value];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              tokens: {
                input: usage.prompt_tokens ?? 0,
                output: usage.completion_tokens ?? 0
              }
            };
            this.messageSubject.next(updatedMessages);
          }
        } catch (error) {
          console.warn('Unable to parse stream chunk:', rawData, error);
        }
      }
    }

    if (buffer.trim()) {
      const rawData = buffer.trim().replace(/^data:\s*/, '').trim();
      if (rawData && rawData !== '[DONE]') {
        try {
          const parsed = JSON.parse(rawData) as any;
          const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.message?.content ?? '';
          const reasoningDelta = parsed?.choices?.[0]?.delta?.reasoning_content
            ?? parsed?.choices?.[0]?.message?.reasoning_content
            ?? parsed?.reasoning_content
            ?? '';
          if (reasoningDelta) {
            this.appendToLastMessage(undefined, reasoningDelta);
          }
          if (delta) {
            this.appendToLastMessage(delta);
          }
        } catch (error) {
          console.warn('Unable to parse final stream chunk:', rawData, error);
        }
      }
    }
  }

  async sendMessage(
    content: string,
    model: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number,
    images: string[] = [],
    reasoningEnabled: boolean = true
  ): Promise<void> {
    this.reasoningEnabled = reasoningEnabled;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      images: images.length > 0 ? [...images] : undefined
    };
    this.addMessage(userMessage);

    // Add empty assistant message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    this.addMessage(assistantMessage);

    this.generatingSubject.next(true);
    this.requestStatusSubject.next('generating');
    this.connectionStatusSubject.next('connected');

    try {
      const messages = this.toOpenAiMessages(this.getMessages(), systemPrompt);
      await this.streamChatCompletion(model, messages, temperature, maxTokens, reasoningEnabled);
    } catch (error) {
      this.connectionStatusSubject.next('error');
      this.requestStatusSubject.next('error');
      console.error('Error sending message:', error);
      // Keep the message but mark it as an error
    } finally {
      this.generatingSubject.next(false);
      this.requestStatusSubject.next(this.connectionStatusSubject.value === 'connected' ? 'idle' : 'error');
    }
  }

  removeLastMessage(): void {
    const messages = this.messageSubject.value;
    if (messages.length > 0) {
      this.messageSubject.next(messages.slice(0, -1));
    }
  }

  clearMessages(): void {
    this.messageSubject.next([]);
  }

  stopGeneration(): void {
    this.stopGenerationSubject.next();
    this.generatingSubject.next(false);
    this.requestStatusSubject.next(this.connectionStatusSubject.value === 'connected' ? 'idle' : 'error');
  }

  fetchModels(): Observable<any> {
    return this.http.get(`${this.apiUrl}/models`);
  }
}
