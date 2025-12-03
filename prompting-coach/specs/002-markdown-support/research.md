# Research: Markdown Support for UI

**Feature**: 002-markdown-support  
**Date**: 2025-12-03  
**Status**: Complete

## Research Tasks

### 1. Markdown Parser Library Selection

**Context**: Need a JavaScript markdown parser for browser use with GFM support, XSS sanitization, and small bundle size.

#### Candidates Evaluated

| Library | Bundle Size | GFM Support | XSS Sanitization | Auto-linking | Tables | Task Lists |
|---------|-------------|-------------|------------------|--------------|--------|------------|
| **marked** | ~32KB min | ✅ Built-in | ⚠️ Requires DOMPurify | ✅ Extension | ✅ | ✅ |
| **markdown-it** | ~95KB min | ✅ Via plugins | ⚠️ Requires DOMPurify | ✅ Plugin | ✅ Plugin | ✅ Plugin |
| **micromark** | ~14KB min | ✅ Via extensions | ⚠️ Requires sanitizer | ✅ Extension | ✅ Extension | ✅ Extension |
| **showdown** | ~73KB min | ✅ Built-in | ⚠️ Requires sanitizer | ✅ | ✅ | ✅ |

#### Decision: **marked + DOMPurify**

**Rationale**:
1. **Small bundle**: marked (32KB) + DOMPurify (20KB) = ~52KB total, smaller than markdown-it alone
2. **GFM built-in**: No plugins needed for tables, strikethrough, task lists
3. **Active maintenance**: 30k+ GitHub stars, regular releases, well-documented
4. **Simple API**: Single function call `marked.parse(text)` with options object
5. **Extensible**: Custom renderers available if needed for link behavior

**Alternatives Rejected**:
- **markdown-it**: More powerful but larger bundle, requires multiple plugins for GFM features
- **micromark**: Smallest but requires many extensions, steeper learning curve
- **showdown**: Larger bundle, less active maintenance

### 2. XSS Sanitization Strategy

**Context**: User input may contain malicious HTML/scripts that could execute when rendered.

#### Decision: **DOMPurify**

**Rationale**:
1. **Industry standard**: Most widely used HTML sanitizer for JavaScript
2. **Small footprint**: ~20KB minified
3. **Configurable**: Can whitelist specific tags/attributes
4. **Battle-tested**: Used by major projects (WordPress, etc.)

**Implementation**:
```javascript
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const rawHtml = marked.parse(markdown);
const safeHtml = DOMPurify.sanitize(rawHtml, {
  ADD_ATTR: ['target'],  // Allow target="_blank" on links
  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
                 'strong', 'em', 's', 'code', 'pre', 'blockquote',
                 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 
                 'tbody', 'tr', 'th', 'td', 'input']  // input for task lists
});
```

### 3. Link Behavior Implementation

**Context**: Links must open in new tab (per clarification).

#### Decision: **Custom marked renderer**

**Implementation**:
```javascript
const renderer = {
  link(href, title, text) {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  }
};

marked.use({ renderer });
```

### 4. Focus/Blur Toggle Pattern

**Context**: PromptPanel and InputPanel need to switch between edit (textarea) and preview (rendered HTML) modes.

#### Decision: **State-driven component with CSS transitions**

**Pattern**:
1. Component maintains `isEditing` state (true when focused)
2. Render textarea when `isEditing`, render div with HTML when not
3. On blur: parse markdown, update preview, hide textarea
4. On click (preview): show textarea, focus it
5. Use CSS `opacity` and `position` for smooth transitions (no layout shift)

**Key considerations**:
- Store raw markdown in state (never reverse-parse HTML)
- Debounce parsing on blur to handle rapid focus changes
- Preserve cursor position is not feasible; place at end on re-focus

### 5. Styling Approach

**Context**: Rendered markdown needs consistent styling that matches app theme.

#### Decision: **Scoped CSS with `.markdown-content` wrapper**

**Rationale**:
- Scope all markdown styles under a single class
- Override browser defaults for headings, lists, code blocks
- Use CSS variables for theme consistency
- Code blocks: monospace font, subtle background, no syntax highlighting (per clarification)

## Dependencies to Add

```json
{
  "dependencies": {
    "marked": "^11.0.0",
    "dompurify": "^3.0.0"
  }
}
```

**Total new dependencies**: 2  
**Estimated bundle impact**: ~52KB minified (~15KB gzipped)

## Resolved Clarifications

| Item | Resolution |
|------|------------|
| marked vs markdown-it | marked (smaller, GFM built-in) |
| XSS sanitization | DOMPurify with whitelist |
| Link behavior | Custom renderer with `target="_blank"` |
| Focus toggle pattern | State-driven with CSS transitions |
