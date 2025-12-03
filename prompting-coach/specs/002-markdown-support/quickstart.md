# Quickstart: Markdown Support for UI

**Feature**: 002-markdown-support  
**Date**: 2025-12-03

## Overview

This feature adds markdown rendering to the Prompting Coach UI:
- **Chat messages**: Always rendered as markdown
- **Prompt panel**: Edit raw markdown when focused, preview when unfocused
- **Chat input**: Edit raw markdown when focused, preview when unfocused

## Prerequisites

```bash
# Install new dependencies
npm install marked dompurify
```

## Key Files

| File | Purpose |
|------|---------|
| `src/services/MarkdownService.js` | Markdown parsing + XSS sanitization |
| `src/components/MarkdownField.js` | Reusable edit/preview component |
| `src/styles/markdown.css` | Rendered markdown styling |

## Quick Implementation Guide

### 1. MarkdownService

```javascript
// src/services/MarkdownService.js
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export class MarkdownService {
  constructor() {
    // Configure marked for GFM
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false
    });

    // Custom link renderer for target="_blank"
    const renderer = {
      link(href, title, text) {
        if (href?.startsWith('javascript:')) {
          return text;
        }
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
    };
    marked.use({ renderer });
  }

  parse(markdown) {
    if (!markdown?.trim()) return '';
    
    try {
      const rawHtml = marked.parse(markdown);
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target'],
        ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','hr',
                       'strong','em','s','del','code','pre','blockquote',
                       'ul','ol','li','a','img','table','thead','tbody',
                       'tr','th','td','input'],
        ALLOWED_ATTR: ['href','src','alt','title','target','rel',
                       'type','checked','disabled']
      });
    } catch (error) {
      console.error('MarkdownService.parse error:', error);
      return this.#escapeHtml(markdown);
    }
  }

  #escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Singleton export
export const markdownService = new MarkdownService();
```

### 2. Using in ConversationArea

```javascript
// In ConversationArea.js #renderMessage method
import { markdownService } from '../services/MarkdownService.js';

#renderMessage(message) {
  const html = markdownService.parse(message.content);
  
  return `
    <div class="message message--${message.role}">
      <div class="message__content markdown-content">${html}</div>
    </div>
  `;
}
```

### 3. Using MarkdownField in PromptPanel

```javascript
// In PromptPanel.js
import { MarkdownField } from './MarkdownField.js';

// In template or onRender:
this.markdownField = new MarkdownField(this.$('.prompt-panel__editor'), {
  value: this.getPromptText(),
  placeholder: 'Enter your prompt here...',
  rows: 5,
  onChange: ({ value }) => {
    this.appState?.set('prompt.text', value);
  }
});
```

### 4. Markdown CSS

```css
/* src/styles/markdown.css */
.markdown-content {
  line-height: 1.6;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content h1 { font-size: 1.5em; }
.markdown-content h2 { font-size: 1.3em; }
.markdown-content h3 { font-size: 1.1em; }

.markdown-content code {
  font-family: monospace;
  background: var(--color-surface-alt, #f5f5f5);
  padding: 0.2em 0.4em;
  border-radius: 3px;
}

.markdown-content pre {
  background: var(--color-surface-alt, #f5f5f5);
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content pre code {
  background: none;
  padding: 0;
}

.markdown-content blockquote {
  border-left: 3px solid var(--color-border, #ddd);
  margin-left: 0;
  padding-left: 1em;
  color: var(--color-text-secondary, #666);
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid var(--color-border, #ddd);
  padding: 0.5em;
  text-align: left;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
}

.markdown-content hr {
  border: none;
  border-top: 1px solid var(--color-border, #ddd);
  margin: 1em 0;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 1.5em;
}

.markdown-content li {
  margin: 0.25em 0;
}

/* Task list checkboxes */
.markdown-content input[type="checkbox"] {
  margin-right: 0.5em;
}
```

## Testing

```bash
# Run unit tests
npm test -- --grep "MarkdownService"

# Run e2e tests
npm run test:e2e -- markdown.spec.js
```

## Common Issues

### Links not opening in new tab
Ensure the custom renderer is configured before any `parse()` calls.

### XSS warning in console
DOMPurify is working correctly - it logs when it strips dangerous content.

### Layout shift on focus/blur
Check that `.markdown-field__textarea` and `.markdown-field__preview` have matching dimensions and padding.

## Performance Notes

- Markdown parsing is synchronous and fast (<10ms for typical messages)
- For very long content (>50KB), consider debouncing or showing a loading state
- Rendered HTML is cached in preview mode; only re-parsed on blur
