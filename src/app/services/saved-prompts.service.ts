import { Injectable } from '@angular/core';

export interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class SavedPromptsService {
  private readonly KEY = 'jan_saved_prompts';

  private defaultPrompts: SavedPrompt[] = [
    {
      id: 'default-1',
      name: 'General Assistant',
      prompt: 'You are a helpful AI assistant.',
      createdAt: Date.now()
    }
  ];

  getSavedPrompts(): SavedPrompt[] {
    const data = localStorage.getItem(this.KEY);
    if (data) {
      return JSON.parse(data);
    }
    return this.defaultPrompts;
  }

  savePrompt(prompt: SavedPrompt): void {
    const prompts = this.getSavedPrompts();
    prompts.push(prompt);
    localStorage.setItem(this.KEY, JSON.stringify(prompts));
  }

  deletePrompt(id: string): void {
    const prompts = this.getSavedPrompts();
    const filtered = prompts.filter(p => p.id !== id);
    localStorage.setItem(this.KEY, JSON.stringify(filtered));
  }

  clearAll(): void {
    localStorage.removeItem(this.KEY);
    localStorage.setItem(this.KEY, JSON.stringify(this.defaultPrompts));
  }

  getPrompt(id: string): SavedPrompt | null {
    const prompts = this.getSavedPrompts();
    return prompts.find(p => p.id === id) || null;
  }
}