import { Injectable } from '@angular/core';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  constructor(private sanitizer: DomSanitizer) {
    this.setupMarked();
  }

  private setupMarked(): void {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    const renderer = new marked.Renderer();
    
    renderer.code = ({ text, lang }: any) => {
      const language = lang || 'plaintext';
      let highlightedCode = text;

      if (hljs.getLanguage(language)) {
        try {
          highlightedCode = hljs.highlight(text, { language, ignoreIllegals: false }).value;
        } catch (e) {
          console.error('Error highlighting code:', e);
        }
      }

      const encodedCode = encodeURIComponent(text);
      return `
        <div class="code-block-wrapper">
          <div class="code-block-toolbar">
            <button type="button" class="copy-button" data-copy-code="${encodedCode}" title="Copy code">
              <span class="material-symbols-outlined">content_copy</span>
              <span>Copy</span>
            </button>
          </div>
          <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
        </div>
      `;
    };

    renderer.codespan = ({ text }: any) => {
      return `<code class="inline-code">${text}</code>`;
    };

    renderer.link = ({ href, title, text }: any) => {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title || ''}">${text}</a>`;
    };

    renderer.image = ({ href, title, text }: any) => {
      return `<img src="${href}" alt="${text}" title="${title || ''}" class="markdown-image" />`;
    };

    marked.setOptions({ renderer });
  }

  async parseMarkdown(text: string): Promise<SafeHtml> {
    const html = await marked(text);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  parseMarkdownSync(text: string): SafeHtml {
    const html = marked.parse(text) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  isMarkdownContent(text: string): boolean {
    // Check for common markdown patterns
    const markdownPatterns = [
      /#{1,6}\s+.+/,           // Headers
      /\*{1,3}.+?\*{1,3}/,      // Bold/Italic
      /\[.+?\]\(.+?\)/,         // Links
      /```[\s\S]*?```/,         // Code blocks
      /`[^`]+`/,                // Inline code
      /[-*]\s+.+/,              // Lists
      /^\d+\.\s+.+/m,           // Ordered lists
      />\s+.+/                  // Blockquotes
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  }
}
