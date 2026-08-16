import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AppSettings } from '../../services/storage.service';

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
    advanced: false
  };

  ngOnInit(): void {
    this.localSettings = { ...this.settings };
  }

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.localSettings = { ...this.localSettings, [key]: value };
    this.settingsChange.emit(this.localSettings);
  }

  toggleSection(section: 'generation' | 'appearance' | 'advanced'): void {
    this.expandedSections[section] = !this.expandedSections[section];
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
}
