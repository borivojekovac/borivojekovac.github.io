# Contract: MarkdownField

**Module**: `src/components/MarkdownField.js`  
**Type**: UI Component (extends BaseComponent)  
**Dependencies**: `MarkdownService`, `BaseComponent`

## Purpose

Reusable component that provides a textarea for editing markdown with automatic preview rendering when unfocused. Used by PromptPanel and InputPanel.

## Interface

```javascript
/**
 * MarkdownField - Editable markdown field with preview toggle
 * @extends BaseComponent
 */
class MarkdownField extends BaseComponent {
  /**
   * Creates a MarkdownField
   * @param {HTMLElement} container - DOM container
   * @param {Object} options
   * @param {string} options.value - Initial markdown text
   * @param {string} options.placeholder - Placeholder text
   * @param {string} options.className - Additional CSS class
   * @param {number} options.rows - Textarea rows (default: 3)
   * @param {boolean} options.disabled - Disable editing
   * @param {Function} options.onChange - Called when value changes
   * @param {Function} options.onFocus - Called when field gains focus
   * @param {Function} options.onBlur - Called when field loses focus
   */
  constructor(container, options = {})

  /**
   * Get current raw markdown value
   * @returns {string}
   */
  getValue()

  /**
   * Set markdown value programmatically
   * @param {string} value - New markdown text
   * @param {boolean} rerender - Whether to re-render (default: true)
   */
  setValue(value, rerender = true)

  /**
   * Focus the textarea (switches to edit mode)
   */
  focus()

  /**
   * Blur the textarea (switches to preview mode)
   */
  blur()

  /**
   * Check if currently in edit mode
   * @returns {boolean}
   */
  isEditing()

  /**
   * Enable or disable the field
   * @param {boolean} disabled
   */
  setDisabled(disabled)
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `markdown:change` | `{ value: string }` | Value changed during editing |
| `markdown:focus` | `{ value: string }` | Field entered edit mode |
| `markdown:blur` | `{ value: string, html: string }` | Field entered preview mode |

## DOM Structure

### Edit Mode (focused)
```html
<div class="markdown-field markdown-field--editing">
  <textarea 
    class="markdown-field__textarea"
    placeholder="..."
    rows="3"
  >raw markdown here</textarea>
</div>
```

### Preview Mode (unfocused)
```html
<div class="markdown-field markdown-field--preview">
  <div 
    class="markdown-field__preview markdown-content"
    tabindex="0"
  >
    <p><strong>rendered</strong> markdown here</p>
  </div>
</div>
```

### Empty Preview Mode
```html
<div class="markdown-field markdown-field--preview markdown-field--empty">
  <div 
    class="markdown-field__preview markdown-field__placeholder"
    tabindex="0"
  >
    Placeholder text...
  </div>
</div>
```

## Behavior

### Focus Transitions

| Current State | Action | New State | Side Effect |
|---------------|--------|-----------|-------------|
| Preview | Click on preview | Editing | Focus textarea, emit `markdown:focus` |
| Preview | Tab into field | Editing | Focus textarea, emit `markdown:focus` |
| Editing | Click outside | Preview | Parse markdown, emit `markdown:blur` |
| Editing | Tab out | Preview | Parse markdown, emit `markdown:blur` |
| Editing | Escape key | Preview | Parse markdown, emit `markdown:blur` |

### Value Handling

| Scenario | Behavior |
|----------|----------|
| Empty value, unfocused | Show placeholder text (not rendered) |
| Whitespace-only, unfocused | Show placeholder text |
| Has content, unfocused | Show rendered markdown |
| Any value, focused | Show raw markdown in textarea |
| Value change during edit | Emit `markdown:change`, don't re-parse until blur |

### Accessibility

- Preview div has `tabindex="0"` for keyboard navigation
- Textarea has `aria-label` matching placeholder
- Preview has `role="textbox"` and `aria-readonly="true"`
- Focus ring visible in both modes

## CSS Classes

| Class | Description |
|-------|-------------|
| `.markdown-field` | Root container |
| `.markdown-field--editing` | Edit mode active |
| `.markdown-field--preview` | Preview mode active |
| `.markdown-field--empty` | No content (show placeholder) |
| `.markdown-field--disabled` | Field is disabled |
| `.markdown-field__textarea` | The textarea element |
| `.markdown-field__preview` | The preview container |
| `.markdown-field__placeholder` | Placeholder text styling |
| `.markdown-content` | Scoped markdown styles (shared) |

## Usage Example

```javascript
import { MarkdownField } from '../components/MarkdownField.js';

const field = new MarkdownField(container, {
  value: '**Hello** world',
  placeholder: 'Enter your prompt...',
  rows: 5,
  onChange: ({ value }) => {
    console.log('Value changed:', value);
  },
  onBlur: ({ value, html }) => {
    console.log('Preview:', html);
  }
});

// Programmatic control
field.setValue('New **content**');
field.focus();
const currentValue = field.getValue();
```

## Testing Requirements

| Test Case | Expected |
|-----------|----------|
| Initial render (with value) | Shows preview mode with rendered HTML |
| Initial render (empty) | Shows placeholder in preview mode |
| Click preview | Switches to edit mode, focuses textarea |
| Type in textarea | Emits `markdown:change` events |
| Blur textarea | Switches to preview, shows rendered HTML |
| Tab navigation | Can tab into and out of field |
| Disabled state | Cannot edit, shows preview only |
| Rapid focus/blur | No visual glitches, correct final state |
