# Data Model: Markdown Support for UI

**Feature**: 002-markdown-support  
**Date**: 2025-12-03

## Entities

### MarkdownContent

Represents text that may contain markdown syntax with both raw and rendered representations.

| Field | Type | Description |
|-------|------|-------------|
| `raw` | `string` | Original markdown source text |
| `html` | `string` | Sanitized HTML output from parsing |
| `isEmpty` | `boolean` | True if raw text is empty or whitespace-only |

**Invariants**:
- `html` is always derived from `raw` via MarkdownService
- `html` is always XSS-sanitized
- `raw` is the source of truth; never reverse-parse `html` to get `raw`

### ChatMessage (Extended)

Existing entity with new property for rendered content.

| Field | Type | Description | Change |
|-------|------|-------------|--------|
| `id` | `string` | Unique message identifier | Existing |
| `role` | `'user' \| 'coach'` | Message sender | Existing |
| `content` | `string` | Raw message text (markdown) | Existing |
| `renderedContent` | `string` | Sanitized HTML for display | **NEW** |
| `messageType` | `string` | Message classification | Existing |
| `timestamp` | `Date` | When message was created | Existing |
| `llmMetadata` | `object \| null` | LLM response metadata | Existing |

**Behavior**:
- `renderedContent` is computed when message is created/updated
- If parsing fails, `renderedContent` falls back to escaped `content`

### EditableMarkdownField (UI State)

Represents the state of a markdown field that toggles between edit and preview modes.

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string` | Current raw markdown text |
| `isEditing` | `boolean` | True when textarea is focused |
| `renderedHtml` | `string` | Cached HTML for preview mode |
| `placeholder` | `string` | Placeholder text when empty |

**State Transitions**:

```
┌─────────────┐     focus      ┌─────────────┐
│   Preview   │ ─────────────► │   Editing   │
│ (isEditing  │                │ (isEditing  │
│  = false)   │ ◄───────────── │  = true)    │
└─────────────┘     blur       └─────────────┘
                 (parse md)
```

**Invariants**:
- On blur: `renderedHtml` is updated from `value`
- On focus: `value` is displayed in textarea (never modified)
- Empty `value` shows `placeholder` in preview mode

## Validation Rules

### Markdown Parsing

| Rule | Behavior |
|------|----------|
| Empty input | Returns empty string |
| Whitespace-only | Returns empty string |
| Invalid markdown | Renders as-is (graceful degradation) |
| Malicious HTML | Stripped by DOMPurify |
| Very long input (>100KB) | Parse with warning log |

### Link Validation

| Rule | Behavior |
|------|----------|
| `http://` or `https://` URLs | Rendered as clickable links |
| `javascript:` URLs | Stripped (XSS protection) |
| Relative URLs | Rendered as-is |
| Bare URLs (auto-link) | Converted to clickable links |

## Relationships

```
┌─────────────────┐
│   ChatMessage   │
│                 │
│ content ────────┼──► MarkdownService.parse() ──► renderedContent
└─────────────────┘

┌─────────────────┐
│  PromptPanel    │
│                 │
│ prompt.text ────┼──► MarkdownField ──► edit/preview toggle
└─────────────────┘

┌─────────────────┐
│   InputPanel    │
│                 │
│ input value ────┼──► MarkdownField ──► edit/preview toggle
└─────────────────┘

┌─────────────────┐
│ConversationArea │
│                 │
│ chatHistory[] ──┼──► renders each message.renderedContent
└─────────────────┘
```
