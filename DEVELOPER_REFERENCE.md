# Developer Reference - UI Improvements

## CSS Architecture

### CSS Variables System

All theming is handled through CSS custom properties (variables) defined in `src/styles.css`:

```css
/* Dark Theme (Default) */
:root, html[data-theme="dark"], html:not([data-theme]) {
  --bg: #0b1020;              /* Background color */
  --bg-soft: #111827;         /* Soft background */
  --panel: rgba(15, 23, 42, 0.8);        /* Panel backgrounds */
  --panel-strong: #111827;    /* Strong panels */
  --panel-elevated: rgba(17, 24, 39, 0.82);  /* Elevated panels */
  --surface: rgba(148, 163, 184, 0.08);  /* Surface/button base */
  --surface-strong: rgba(148, 163, 184, 0.14);  /* Strong surface */
  --line: rgba(148, 163, 184, 0.2);  /* Borders */
  --text: #e5e7eb;            /* Primary text */
  --text-soft: #94a3b8;       /* Secondary text */
  --muted: #64748b;           /* Muted text */
  --shadow: rgba(2, 6, 23, 0.45);  /* Shadow color */
  --accent: #2c61b7;          /* Accent color */
  --accent-strong: #163c8e;   /* Strong accent */
  --accent-soft: rgba(59, 130, 246, 0.12);  /* Soft accent */
}
```

### How It Works

1. **HTML Element**: Receives `data-theme` attribute
   ```typescript
   document.documentElement.setAttribute('data-theme', 'light');
   ```

2. **CSS Selector**: Matches and applies variables
   ```css
   html[data-theme="light"] {
     --bg: #f4f7fb;
     --text: #111827;
     /* ... all other variables */
   }
   ```

3. **Components**: Use variables
   ```css
   .component {
     background: var(--bg);
     color: var(--text);
     border: 1px solid var(--line);
   }
   ```

---

## Copy Button CSS

### File Location
`src/app/components/message/message.component.css` (lines 277-307)

### Current Implementation

```css
.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  /* Gradient background */
  background: linear-gradient(135deg, var(--surface), var(--surface-strong));
  color: var(--text-soft);
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  /* Smooth transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

/* Hover State */
.copy-button:hover {
  background: var(--surface-strong);
  color: var(--text);
  border-color: rgba(148, 163, 184, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--shadow);
}

/* Active State */
.copy-button:active {
  transform: translateY(0);
}

/* Success State */
.copy-button.copied {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.35);
  animation: successFlash 0.3s ease-out;
}

/* Icon Sizing */
.copy-button .material-symbols-outlined {
  font-size: 1rem;
}
```

### Animation

```css
@keyframes successFlash {
  0% {
    background: rgba(16, 185, 129, 0.25);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
  }
  100% {
    background: rgba(16, 185, 129, 0.12);
    box-shadow: 0 4px 12px var(--shadow);
  }
}
```

---

## TypeScript Theme Management

### File Location
`src/app/components/chat/chat.component.ts` (line 46-50)

### Implementation

```typescript
private applyTheme(theme: AppSettings['theme']): void {
  document.documentElement.setAttribute('data-theme', theme);
  this.settings = { ...this.settings, theme };
}

ngOnInit(): void {
  this.settings = this.storageService.getSettings();
  this.applyTheme(this.settings.theme);
  // ... rest of initialization
}

onSettingsChange(newSettings: AppSettings): void {
  this.settings = { ...newSettings, apiUrl: effectiveApiUrl };
  this.storageService.saveSettings(this.settings);
  this.applyTheme(this.settings.theme);
  // ... rest of settings handling
}
```

### Type Definition

From `src/app/services/storage.service.ts`:

```typescript
interface AppSettings {
  theme: 'dark' | 'light' | 'pink' | 'pink2';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  apiUrl: string;
  lanMode: boolean;
  selectedModelId: string;
  reasoningEnabled: boolean;
}
```

---

## Copy Button Implementation

### TypeScript Handler
`src/app/components/message/message.component.ts` (lines 34-64)

```typescript
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

  // Decode the code
  const code = decodeURIComponent(rawCode);
  const dataset = button.dataset as Record<string, string>;

  // Copy to clipboard
  navigator.clipboard.writeText(code).then(() => {
    const previousLabel = dataset['originalLabel'] || 'Copy';
    dataset['originalLabel'] = previousLabel;
    button.textContent = 'Copied';
    button.classList.add('copied');

    // Revert after 2 seconds
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
```

### HTML Template (Auto-Generated)

Generated in `src/app/services/markdown.service.ts`:

```html
<div class="code-block-wrapper">
  <div class="code-block-toolbar">
    <button type="button" class="copy-button" data-copy-code="${encodedCode}" title="Copy code">
      <span class="material-symbols-outlined">content_copy</span>
      <span>Copy</span>
    </button>
  </div>
  <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
</div>
```

---

## CSS Gradient Guide

### Why Gradient?
The gradient creates visual depth and matches modern UI trends:

```css
background: linear-gradient(135deg, var(--surface), var(--surface-strong));
```

- **135deg**: Diagonal angle (top-left to bottom-right)
- **var(--surface)**: Lighter start color
- **var(--surface-strong)**: Darker end color
- **Effect**: Subtle depth, modern look

### Gradient in Each Theme

**Dark Theme:**
- Start: rgba(148, 163, 184, 0.08) - Light gray
- End: rgba(148, 163, 184, 0.14) - Darker gray
- Effect: Subtle light to dark

**Light Theme:**
- Start: rgba(15, 23, 42, 0.04) - Very light
- End: rgba(15, 23, 42, 0.08) - Slightly darker
- Effect: Minimal gradient, subtle

**Pink Theme:**
- Start: rgba(244, 114, 182, 0.07) - Light pink
- End: rgba(244, 114, 182, 0.13) - Darker pink
- Effect: Pink gradient

**Pink 2 Theme:**
- Start: rgba(236, 72, 153, 0.06) - Light magenta
- End: rgba(236, 72, 153, 0.11) - Darker magenta
- Effect: Magenta gradient

---

## Transition Timing Functions

### cubic-bezier for Copy Button

```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

- **cubic-bezier(0.4, 0, 0.2, 1)**: "Material" easing
  - Fast start, smooth deceleration
  - Professional, natural feel
  - Often used in Material Design

### Alternative Timing Functions

```css
/* Ease-out: Fast start, slow end */
transition: all 0.2s ease-out;

/* Ease-in: Slow start, fast end */
transition: all 0.2s ease-in;

/* Linear: Constant speed */
transition: all 0.2s linear;
```

---

## Theme Transition Enhancement

### File: `src/styles.css`

```css
html, body {
  transition: background-color 0.3s ease, color 0.3s ease;
}

html {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

This creates smooth 300ms fade when switching themes.

### Browser Support

- ✅ Chrome 26+
- ✅ Firefox 16+
- ✅ Safari 9+
- ✅ Edge 12+

---

## How to Extend

### Adding a New Theme

1. **Add CSS Variables** in `src/styles.css`:
```css
html[data-theme="purple"] {
  color-scheme: dark;
  --bg: #2d1b4e;
  --text: #f3e9ff;
  --accent: #7c3aed;
  --surface: rgba(124, 58, 237, 0.08);
  /* ... other variables */
}
```

2. **Update Type Definition** in `src/app/services/storage.service.ts`:
```typescript
theme: 'dark' | 'light' | 'pink' | 'pink2' | 'purple';
```

3. **Add Button** in settings template:
```html
<button 
  class="theme-btn"
  [class.active]="localSettings.theme === 'purple'"
  (click)="updateSetting('theme', 'purple')">
  <span class="material-symbols-outlined">🟣</span>
  Purple
</button>
```

---

## Performance Considerations

### CSS Optimization
- ✅ Uses CSS variables (minimal recalculation)
- ✅ GPU-accelerated transforms (translateY)
- ✅ Efficient selectors (no deep nesting)
- ✅ Minimal repaints (only on hover/active)

### Animation Performance
- ✅ Uses `transform` and `box-shadow` (GPU accelerated)
- ✅ Short duration (0.2s-0.3s)
- ✅ No expensive properties (width, height)
- ✅ Hardware acceleration enabled

---

## Testing Guide

### Manual Testing Checklist

```typescript
// Copy button functionality
✓ Hover shows elevation
✓ Click adds 'copied' class
✓ Clipboard.writeText called
✓ Text changes to "Copied"
✓ Reverts after 2 seconds
✓ Works in all themes

// Theme switching
✓ data-theme attribute set
✓ CSS variables updated
✓ All colors change
✓ Settings saved to storage
✓ Survives page refresh
```

### Browser DevTools

```javascript
// Test theme switching
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.setAttribute('data-theme', 'dark');

// Check CSS variables
getComputedStyle(document.documentElement).getPropertyValue('--text');

// Check storage
localStorage.getItem('appSettings');
```

---

## Common Issues & Solutions

### Issue: Theme Not Applying
**Solution**: Check if `data-theme` attribute is set
```javascript
console.log(document.documentElement.getAttribute('data-theme'));
```

### Issue: Copy Button Not Showing Gradient
**Solution**: Ensure CSS file is loaded
```css
/* Check if applied */
.copy-button {
  background: linear-gradient(...) !important;
}
```

### Issue: Animation Stuttering
**Solution**: Enable hardware acceleration
```css
.copy-button {
  will-change: transform;
  backface-visibility: hidden;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-16 | Initial implementation |

---

## Related Files

- `src/styles.css` - Global theme variables
- `src/app/components/message/message.component.css` - Copy button styles
- `src/app/components/message/message.component.ts` - Copy logic
- `src/app/components/chat/chat.component.ts` - Theme application
- `src/app/services/storage.service.ts` - Settings storage
- `src/app/services/markdown.service.ts` - Markdown rendering (generates buttons)

---

Generated: 2026-08-16
