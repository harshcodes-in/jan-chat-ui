import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Message } from '../../services/chat.service';
import { MarkdownService } from '../../services/markdown.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageComponent {
  @Input() message!: Message;
  @Output() editMessage = new EventEmitter<string>();
  @Output() regenerate = new EventEmitter<void>();
  @Output() deleteMessage = new EventEmitter<void>();

  showEditPanel = false;
  showReasoning = false;
  editedContent = '';

  constructor(public markdownService: MarkdownService) {}

  isMarkdown(): boolean {
    return this.markdownService.isMarkdownContent(this.message.content);
  }

  parseMarkdown() {
    return this.markdownService.parseMarkdownSync(this.message.content);
  }

  extractCodeBlocks(): string[] {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = this.message.content.match(codeBlockRegex) || [];
    return matches.map(block => block.replace(/```[\w]*\n?|\n?```/g, ''));
  }

  handleCopyClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('.copy-button') as HTMLButtonElement | null;

    if (!button) {
      return;
    }

    const rawCode = button.getAttribute('data-copy-code');
    if (!rawCode) {
      return;
    }

    const code = decodeURIComponent(rawCode);
    const dataset = button.dataset as Record<string, string>;

    navigator.clipboard.writeText(code).then(() => {
      const previousLabel = dataset['originalLabel'] || 'Copy';
      dataset['originalLabel'] = previousLabel;
      button.textContent = 'Copied';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = previousLabel;
        button.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      button.textContent = 'Failed';
      setTimeout(() => {
        button.textContent = dataset['originalLabel'] || 'Copy';
      }, 1500);
    });
  }

  startEdit(): void {
    this.editedContent = this.message.content;
    this.showEditPanel = true;
  }

  saveEdit(): void {
    if (this.editedContent.trim()) {
      this.editMessage.emit(this.editedContent);
      this.showEditPanel = false;
    }
  }

  cancelEdit(): void {
    this.showEditPanel = false;
    this.editedContent = '';
  }

  getFormattedTime(): string {
    const date = new Date(this.message.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getTokensDisplay(): string {
    if (!this.message.tokens) return '';
    return `${this.message.tokens.input} → ${this.message.tokens.output}`;
  }
}
