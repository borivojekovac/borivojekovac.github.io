# Contract: MarkdownService

**Module**: `src/services/MarkdownService.js`  
**Type**: Singleton Service  
**Dependencies**: `marked`, `dompurify`

## Purpose

Centralized markdown parsing and HTML sanitization service. Provides a single point of configuration for markdown rendering across the application.

## Interface

```javascript
/**
 * MarkdownService - Singleton service for markdown parsing
 */
class MarkdownService {
  /**
   * Parse markdown text to sanitized HTML
   * @param {string} markdown - Raw markdown text
   * @returns {string} Sanitized HTML string
   * @throws {never} - Always returns string, logs errors internally
   */
  parse(markdown)

  /**
   * Check if text contains any markdown syntax
   * @param {string} text - Text to check
   * @returns {boolean} True if markdown syntax detected
   */
  hasMarkdown(text)

  /**
   * Parse markdown with performance logging
   * @param {string} markdown - Raw markdown text
   * @param {string} context - Context label for logging
   * @returns {string} Sanitized HTML string
   */
  parseWithTiming(markdown, context)
}
```

## Configuration

```javascript
// Marked options
{
  gfm: true,           // GitHub Flavored Markdown
  breaks: true,        // GFM line breaks (single newline = <br>)
  pedantic: false,     // Don't be strict about original markdown spec
  headerIds: false,    // Don't add IDs to headers (security)
  mangle: false        // Don't mangle email addresses
}

// DOMPurify options
{
  ADD_ATTR: ['target'],
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 's', 'del',
    'code', 'pre',
    'blockquote',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'input'  // For task list checkboxes
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'target', 'rel',
    'type', 'checked', 'disabled'  // For task list checkboxes
  ]
}
```

## Custom Renderers

### Link Renderer
- All links open in new tab (`target="_blank"`)
- Security attributes added (`rel="noopener noreferrer"`)
- `javascript:` URLs are blocked

### Image Renderer
- Images render with `alt` attribute for accessibility
- Failed images show alt text
- No lazy loading (messages are typically short)

## Behavior

| Input | Output |
|-------|--------|
| `null` or `undefined` | `''` (empty string) |
| `''` (empty) | `''` (empty string) |
| `'   '` (whitespace) | `''` (empty string) |
| `'Hello'` (plain text) | `'<p>Hello</p>'` |
| `'**bold**'` | `'<p><strong>bold</strong></p>'` |
| `'<script>alert(1)</script>'` | `''` (stripped) |
| `'[link](javascript:alert(1))'` | `'<p><a>link</a></p>'` (href stripped) |

## Error Handling

- Parsing errors are caught and logged
- On error, returns HTML-escaped original text as fallback
- Never throws exceptions to caller

## Usage Example

```javascript
import { MarkdownService } from '../services/MarkdownService.js';

const markdownService = new MarkdownService();

// Basic usage
const html = markdownService.parse('**Hello** world');
// Returns: '<p><strong>Hello</strong> world</p>'

// With timing (for performance monitoring)
const html = markdownService.parseWithTiming(longText, 'chat-message');
// Logs: "MarkdownService.parse [chat-message]: 5ms"
```

## Testing Requirements

| Test Case | Expected |
|-----------|----------|
| Empty string | Returns empty string |
| Plain text | Wrapped in `<p>` |
| Bold/italic | Correct `<strong>`/`<em>` tags |
| Nested lists | Proper `<ul>`/`<ol>` nesting |
| GFM tables | Valid `<table>` structure |
| Task lists | Checkboxes with correct state |
| XSS attempt | Malicious content stripped |
| Auto-linking | Bare URLs become `<a>` tags |
| Link target | All links have `target="_blank"` |
