# Research: Unified Layout

**Feature**: 001-unified-layout  
**Date**: 2025-12-03

## Research Topics

### 1. Fixed Panel Layout Patterns

**Decision**: Use CSS Flexbox with `position: sticky` for fixed panels

**Rationale**:
- `position: sticky` provides fixed behavior while maintaining document flow
- Flexbox handles the three-panel vertical layout naturally
- No JavaScript required for basic layout behavior
- Works well with maximize feature (switch to `position: fixed` when maximized)

**Alternatives Considered**:
- `position: fixed` for all panels: Rejected - requires manual height calculations and doesn't flow naturally
- CSS Grid: Viable but Flexbox is simpler for single-column vertical layout
- JavaScript-based layout: Rejected - unnecessary complexity for CSS-solvable problem

### 2. Maximize/Fullscreen Pattern

**Decision**: CSS class toggle with `position: fixed` and `z-index` layering

**Rationale**:
- Simple CSS class toggle (`.maximized`) handles all visual changes
- `position: fixed` with `inset: 0` (below app title) covers viewport
- High `z-index` ensures maximized panel covers siblings
- Escape key handler already exists in BaseComponent pattern
- Single state variable (`maximizedPanel: 'prompt' | 'conversation' | 'input' | null`)

**Alternatives Considered**:
- Fullscreen API (`element.requestFullscreen()`): Rejected - too aggressive, hides browser chrome
- Dialog element: Rejected - semantic mismatch, not a dialog
- Portal/overlay pattern: Rejected - unnecessary DOM manipulation

### 3. Conversation Message Unification

**Decision**: Extend existing `ChatMessage` model with `type` field for LLM responses

**Rationale**:
- Existing `ChatMessage` model has `role` (user/coach/system)
- Add `type` field: `'chat' | 'llm_response'` to distinguish LLM test results
- LLM responses get distinct styling via CSS class
- Chronological ordering preserved naturally

**Alternatives Considered**:
- Separate message lists: Rejected - complicates rendering and ordering
- New model class: Rejected - unnecessary when existing model can be extended
- Wrapper component: Rejected - adds indirection without benefit

### 4. Component Extraction Strategy

**Decision**: Create new components, deprecate old ones, migrate incrementally

**Rationale**:
- `PromptWorkspace.js` (16KB) contains prompt editing + LLM testing logic
- `CoachPanel.js` (15KB) contains coaching chat logic
- Extract shared functionality into new focused components:
  - `PromptPanel.js` - prompt editing only (from PromptWorkspace)
  - `ConversationArea.js` - message display (from CoachPanel)
  - `InputPanel.js` - user input + buttons (from both)
- Keep old components for rollback capability
- Use feature flag or config to switch between layouts

**Alternatives Considered**:
- In-place refactor: Rejected - high risk, no rollback path
- Complete rewrite: Rejected - loses tested functionality
- Gradual migration with adapter: Chosen approach

### 5. State Management for Maximize

**Decision**: Add `ui.maximizedPanel` to existing AppState

**Rationale**:
- AppState already manages UI state (active tab, loading states)
- Single source of truth for which panel is maximized
- Components subscribe to state changes via existing EventTarget pattern
- Escape key handler dispatches state change

**State Shape**:
```javascript
{
  ui: {
    maximizedPanel: null | 'prompt' | 'conversation' | 'input',
    // existing ui state...
  }
}
```

### 6. Navigation Simplification

**Decision**: Convert TabBar to minimal icon bar with Settings and History

**Rationale**:
- Workspace and Coach tabs become obsolete (unified view)
- Settings dialog still needed (API keys, preferences)
- History panel still needed (US3 - future feature)
- Minimal icon bar at bottom or hamburger menu at top

**Alternatives Considered**:
- Remove TabBar entirely: Rejected - still need Settings/History access
- Sidebar navigation: Rejected - wastes horizontal space
- Top menu bar: Viable alternative, but bottom icons more thumb-friendly on mobile

## Resolved Clarifications

No NEEDS CLARIFICATION items from Technical Context - all requirements are clear.

## Dependencies

No new dependencies required. Implementation uses:
- Existing CSS custom properties for theming
- Existing BaseComponent class for lifecycle
- Existing AppState for state management
- Existing LogService for debugging

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing coaching flow | Medium | High | Keep old components, feature flag for rollback |
| Performance regression from DOM changes | Low | Medium | Profile before/after, optimize if needed |
| CSS conflicts with existing styles | Medium | Low | Namespace new styles with `.unified-` prefix |
| State sync issues between panels | Low | Medium | Single AppState source of truth |
