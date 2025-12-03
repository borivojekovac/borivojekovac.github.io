# Component Contracts: Unified Layout

**Feature**: 001-unified-layout  
**Date**: 2025-12-03

## Component Hierarchy

```
App
└── UnifiedView
    ├── PromptPanel
    │   └── MaximizeToggle
    ├── ConversationArea
    │   ├── MessageList
    │   │   └── ConversationMessage (repeated)
    │   └── MaximizeToggle
    └── InputPanel
        └── MaximizeToggle
```

---

## UnifiedView

**Purpose**: Main container that orchestrates the three-panel layout

**File**: `src/components/UnifiedView.js`

### Props/Config
```javascript
{
  appState: AppState,  // Reference to application state
}
```

### Public Methods
```javascript
class UnifiedView extends BaseComponent {
  /**
   * Maximize a specific panel, restoring any currently maximized panel
   * @param {string} panelId - 'prompt' | 'conversation' | 'input'
   */
  maximizePanel(panelId)
  
  /**
   * Restore the currently maximized panel to normal view
   */
  restorePanel()
  
  /**
   * Check if a specific panel is currently maximized
   * @param {string} panelId
   * @returns {boolean}
   */
  isPanelMaximized(panelId)
}
```

### Events Emitted
- `panel:maximize` - When a panel is maximized `{ panelId: string }`
- `panel:restore` - When a panel is restored to normal

### State Subscriptions
- `ui.maximizedPanel` - Tracks which panel is maximized

---

## PromptPanel

**Purpose**: Displays and allows editing of the current prompt

**File**: `src/components/PromptPanel.js`

### Props/Config
```javascript
{
  appState: AppState,
  onMaximize: () => void,  // Callback when maximize toggled
}
```

### Public Methods
```javascript
class PromptPanel extends BaseComponent {
  /**
   * Get current prompt text
   * @returns {string}
   */
  getPromptText()
  
  /**
   * Set prompt text programmatically
   * @param {string} text
   */
  setPromptText(text)
  
  /**
   * Focus the prompt textarea
   */
  focus()
}
```

### Events Emitted
- `prompt:change` - When prompt text changes `{ text: string, charCount: number, wordCount: number }`

### State Subscriptions
- `prompt.text` - Current prompt text
- `ui.maximizedPanel` - To apply maximized styling

### DOM Structure
```html
<div class="prompt-panel" data-maximized="false">
  <div class="prompt-panel__header">
    <span class="prompt-panel__stats">0 chars | 0 words</span>
    <button class="maximize-toggle" aria-label="Maximize prompt panel">
      <span class="icon">⤢</span>
    </button>
  </div>
  <textarea class="prompt-panel__input" placeholder="Enter your prompt..."></textarea>
</div>
```

---

## ConversationArea

**Purpose**: Displays chronological list of coaching messages and LLM responses

**File**: `src/components/ConversationArea.js`

### Props/Config
```javascript
{
  appState: AppState,
  onMaximize: () => void,
}
```

### Public Methods
```javascript
class ConversationArea extends BaseComponent {
  /**
   * Add a new message to the conversation
   * @param {ChatMessage} message
   */
  addMessage(message)
  
  /**
   * Scroll to the bottom of the conversation
   */
  scrollToBottom()
  
  /**
   * Clear all messages (for new session)
   */
  clearMessages()
}
```

### Events Emitted
- `message:added` - When a new message is displayed `{ message: ChatMessage }`

### State Subscriptions
- `session.messages` - Array of ChatMessage objects
- `ui.maximizedPanel` - To apply maximized styling

### DOM Structure
```html
<div class="conversation-area" data-maximized="false">
  <div class="conversation-area__header">
    <span class="conversation-area__title">Conversation</span>
    <button class="maximize-toggle" aria-label="Maximize conversation">
      <span class="icon">⤢</span>
    </button>
  </div>
  <div class="conversation-area__messages">
    <!-- ConversationMessage components rendered here -->
  </div>
</div>
```

---

## InputPanel

**Purpose**: User input area with send button and test prompt button

**File**: `src/components/InputPanel.js`

### Props/Config
```javascript
{
  appState: AppState,
  onMaximize: () => void,
  onSendMessage: (text: string) => void,
  onTestPrompt: () => void,
}
```

### Public Methods
```javascript
class InputPanel extends BaseComponent {
  /**
   * Get current input text
   * @returns {string}
   */
  getInputText()
  
  /**
   * Clear the input field
   */
  clearInput()
  
  /**
   * Focus the input field
   */
  focus()
  
  /**
   * Enable/disable the test prompt button
   * @param {boolean} enabled
   */
  setTestButtonEnabled(enabled)
}
```

### Events Emitted
- `input:send` - When user sends a message `{ text: string }`
- `input:test` - When user clicks test prompt button

### State Subscriptions
- `prompt.text` - To enable/disable test button
- `ui.maximizedPanel` - To apply maximized styling
- `ui.isLoading` - To show loading state on buttons

### DOM Structure
```html
<div class="input-panel" data-maximized="false">
  <div class="input-panel__header">
    <button class="maximize-toggle" aria-label="Maximize input">
      <span class="icon">⤢</span>
    </button>
  </div>
  <div class="input-panel__content">
    <textarea class="input-panel__textarea" placeholder="Type a message..."></textarea>
    <div class="input-panel__actions">
      <button class="btn btn-secondary" id="test-prompt-btn" disabled>
        Test Prompt
      </button>
      <button class="btn btn-primary" id="send-btn">
        Send
      </button>
    </div>
  </div>
</div>
```

---

## MaximizeToggle

**Purpose**: Reusable button component for maximize/restore functionality

**File**: `src/components/MaximizeToggle.js`

### Props/Config
```javascript
{
  panelId: string,  // Which panel this toggle controls
  isMaximized: boolean,
  onToggle: (panelId: string) => void,
}
```

### DOM Structure
```html
<button class="maximize-toggle" 
        aria-label="Maximize panel" 
        aria-pressed="false"
        data-panel-id="prompt">
  <span class="maximize-toggle__icon">⤢</span>
</button>
```

### States
- Default: Shows expand icon (⤢)
- Maximized: Shows restore icon (⤡) and `aria-pressed="true"`

---

## CSS Class Contracts

### Layout Classes
```css
.unified-view           /* Main container, flex column */
.unified-view--has-maximized  /* When any panel is maximized */

.prompt-panel           /* Top fixed panel */
.conversation-area      /* Center scrollable area */
.input-panel            /* Bottom fixed panel */
```

### Maximize Classes
```css
.panel--maximized       /* Applied to maximized panel */
.panel--hidden          /* Applied to non-maximized panels when one is maximized */
```

### Message Type Classes
```css
.message                /* Base message styling */
.message--user          /* User message */
.message--coach         /* Coach message */
.message--llm-response  /* LLM test response - distinct styling */
```
