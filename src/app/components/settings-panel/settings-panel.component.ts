import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AppSettings, StorageService } from '../../services/storage.service';
import { SavedPromptsService, SavedPrompt } from '../../services/saved-prompts.service';

@Component({
  selector: 'app-settings-panel',
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.css']
})
export class SettingsPanelComponent implements OnInit {
  @Input() settings!: AppSettings;
  @Output() settingsChange = new EventEmitter<AppSettings>();
  @Output() closeSettings = new EventEmitter<void>();

  localSettings: AppSettings = { ...this.settings };
  expandedSections = {
    generation: false,
    appearance: false,
    advanced: false,
    savedPrompts: false
  };

  savedPrompts: SavedPrompt[] = [];

  constructor(private savedPromptsService: SavedPromptsService) {}

  ngOnInit(): void {
    this.localSettings = { ...this.settings };
    this.savedPrompts = this.savedPromptsService.getSavedPrompts();
  }

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.localSettings = { ...this.localSettings, [key]: value };
    this.settingsChange.emit(this.localSettings);
  }

  toggleSection(section: 'generation' | 'appearance' | 'advanced' | 'savedPrompts'): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  savePrompt(): void {
    const prompt = this.localSettings.systemPrompt.trim();
    if (!prompt) {
      alert('Please enter a system prompt to save.');
      return;
    }

    var promptTitle = this.localSettings.promptTitle.trim();
    if (!promptTitle) {
      promptTitle = "Custom"
    }

    const newPrompt: any = {
      id: Date.now().toString(),
      name: promptTitle,
      prompt,
      createdAt: Date.now()
    };

    this.savedPromptsService.savePrompt(newPrompt);
    this.savedPrompts = this.savedPromptsService.getSavedPrompts();
    this.toggleSection('savedPrompts');
  }

  deletePrompt(id: string): void {
    if (confirm('Delete this saved prompt?')) {
      this.savedPromptsService.deletePrompt(id);
      this.savedPrompts = this.savedPromptsService.getSavedPrompts();
    }
  }

  clearAllSavedPrompts(): void {
    if (confirm('Delete all saved prompts? This cannot be undone.')) {
      this.savedPromptsService.clearAll();
      this.savedPrompts = this.savedPromptsService.getSavedPrompts();
    }
  }

  getLanModeUrl(): string {
    const ip = window.location.hostname;
    const port = window.location.port || '80';
    return `http://${ip}:${port}`;
  }

  copyLanUrl(): void {
    const url = this.getLanModeUrl();
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copied to clipboard!');
    });
  }

  resetSettings(): void {
    if (confirm('Reset all settings to default?')) {
      const defaultSettings: AppSettings = {
        theme: 'dark',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: 'You are a helpful AI assistant.',
        promptTitle: 'General Assistant',
        apiUrl: '/api',
        lanMode: false,
        selectedModelId: '',
        reasoningEnabled: true
      };
      this.localSettings = defaultSettings;
      this.settingsChange.emit(defaultSettings);
    }
  }

  closePanel(): void {
    this.closeSettings.emit();
  }

  formatDate(timestamp: number): string {
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

  getTemperatureLabel(): string {
    const temp = this.localSettings.temperature;
    if (temp < 0.3) return 'Deterministic';
    if (temp < 0.7) return 'Balanced';
    return 'Creative';
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }

  parseInt(value: string): number {
    return parseInt(value, 10);
  }

  selectPrompt(promptText:string):void{
    if (!promptText) return;
    
    const prompt = this.savedPrompts.find(p => p.prompt === promptText);
    if (prompt) {
      this.selectSavedPrompt(prompt);
    }
  }

  selectSavedPrompt(prompt: SavedPrompt): void {
    this.localSettings = { ...this.localSettings, systemPrompt: prompt.prompt, promptTitle:prompt.name };
    this.settingsChange.emit(this.localSettings)
    this.savedPrompts = this.savedPromptsService.getSavedPrompts();
    this.toggleSection('savedPrompts');
  }
}
