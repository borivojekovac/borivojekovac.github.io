# Data Model: Unified Layout

**Feature**: 001-unified-layout  
**Date**: 2025-12-03

## Entity Changes

### Modified Entities

#### AppState (Extended)

**Location**: `src/state/AppState.js`

**New Fields**:
```javascript
{
  ui: {
    // Existing fields...
    activeTab: 'workspace' | 'coach' | 'history',  // DEPRECATED
    
    // New fields
    maximizedPanel: null | 'prompt' | 'conversation' | 'input',
    unifiedViewEnabled: true,  // Feature flag for rollback
  }
}
```

**State Transitions**:
- `maximizedPanel`: `null` ↔ `'prompt'` | `'conversation'` | `'input'`
- Only one panel can be maximized at a time
- Setting a new value auto-clears previous

#### ChatMessage (Extended)

**Location**: `src/models/ChatMessage.js`

**New Fields**:
```javascript
{
  // Existing fields
  id: string,
  role: 'user' | 'coach' | 'system',
  content: string,
  timestamp: Date,
  
  // New field
  messageType: 'chat' | 'llm_response',  // Default: 'chat'
  
  // For LLM responses only
  llmMetadata: {
    provider: string,      // e.g., 'openai'
    model: string,         // e.g., 'gpt-4'
    responseTime: number,  // milliseconds
    tokenCount: number,
  } | null
}
```

### New Entities

#### PanelState

**Purpose**: Track individual panel state for maximize feature

**Fields**:
```javascript
{
  panelId: 'prompt' | 'conversation' | 'input',
  isMaximized: boolean,
  defaultHeight: string,  // CSS value, e.g., '200px', '30vh'
  minHeight: string,
  maxHeight: string,
}
```

**Note**: This is a UI-only entity, not persisted to storage.

### Unchanged Entities

The following entities require no changes:
- `Prompt` - prompt text and metadata
- `CoachingSession` - session state and history
- `PrincipleResult` - coaching evaluation results
- `LlmTestResult` - existing model, but results now also create ChatMessage
- `AppSettings` - API keys and preferences

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        AppState                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   prompt    │  │   session   │  │         ui          │  │
│  │   (Prompt)  │  │ (Coaching   │  │  maximizedPanel     │  │
│  │             │  │  Session)   │  │  unifiedViewEnabled │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ConversationArea                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   messages[]                             ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ││
│  │  │ ChatMessage  │  │ ChatMessage  │  │ ChatMessage  │  ││
│  │  │ type: chat   │  │ type: chat   │  │ type: llm_   │  ││
│  │  │ role: coach  │  │ role: user   │  │    response  │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Validation Rules

### MaximizedPanel
- Must be one of: `null`, `'prompt'`, `'conversation'`, `'input'`
- Cannot have multiple panels maximized simultaneously

### ChatMessage.messageType
- Default value: `'chat'`
- If `messageType === 'llm_response'`, then `llmMetadata` should be populated
- If `messageType === 'chat'`, then `llmMetadata` should be `null`

## Migration Notes

### From Existing Data

1. **Existing ChatMessages**: Add `messageType: 'chat'` and `llmMetadata: null` to all existing messages
2. **AppState**: Add new `ui.maximizedPanel: null` and `ui.unifiedViewEnabled: true`
3. **No data loss**: All existing data remains valid

### Backward Compatibility

- Old components (CoachPanel, PromptWorkspace) continue to work with existing data
- New components read same data with extended fields
- Feature flag `unifiedViewEnabled` allows switching between layouts
