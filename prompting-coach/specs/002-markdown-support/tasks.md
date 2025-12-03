# Tasks: Markdown Support for UI

**Input**: Design documents from `/specs/002-markdown-support/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in specification. Test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in descriptions

## Path Conventions

- **Project type**: Single-page web application (Vite + vanilla JS)
- **Source**: `src/` at repository root
- **Tests**: `tests/` at repository root

---

## Phase 1: Setup

**Purpose**: Install dependencies and create base infrastructure

- [x] T001 Install marked and dompurify dependencies via `npm install marked dompurify`
- [x] T002 [P] Create markdown styles file in `src/styles/markdown.css`
- [x] T003 [P] Import markdown.css in main stylesheet or entry point

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core MarkdownService that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until MarkdownService is complete

- [x] T004 Create MarkdownService class in `src/services/MarkdownService.js` with:
  - Constructor configuring marked options (gfm, breaks, headerIds, mangle)
  - Custom link renderer for `target="_blank"` and `rel="noopener noreferrer"`
  - DOMPurify configuration with allowed tags/attributes
  - `parse(markdown)` method returning sanitized HTML
  - `hasMarkdown(text)` method for syntax detection
  - `parseWithTiming(markdown, context)` method for performance logging
  - Error handling with fallback to escaped HTML
- [x] T005 Export singleton instance from `src/services/MarkdownService.js`

**Checkpoint**: MarkdownService ready - user story implementation can begin

---

## Phase 3: User Story 1 - View Rendered Markdown in Chat (Priority: P1) 🎯 MVP

**Goal**: Chat messages (both user and coach) always display rendered markdown

**Independent Test**: Send a message containing `**bold**` and verify it renders as bold text in the chat balloon

### Implementation for User Story 1

- [x] T006 [US1] Add `renderedContent` property to ChatMessage model in `src/models/ChatMessage.js`
- [x] T007 [US1] Update ChatMessage constructor to compute `renderedContent` from `content` using MarkdownService in `src/models/ChatMessage.js`
- [x] T008 [US1] Import MarkdownService in `src/components/ConversationArea.js`
- [x] T009 [US1] Update `#renderMessage()` method in `src/components/ConversationArea.js` to:
  - Use `message.renderedContent` instead of `this.escapeHtml(message.content)`
  - Add `markdown-content` class to message content div
- [x] T010 [US1] Add markdown content styles to `src/styles/markdown.css`:
  - Headings (h1-h6) with distinct sizes and weights
  - Bold, italic, strikethrough styling
  - Inline code with monospace font and background
  - Fenced code blocks with background and padding
  - Blockquotes with left border and indentation
  - Ordered and unordered lists with proper indentation
  - Nested lists (2-3 levels) with increased indentation
  - Tables with borders and cell padding
  - Task list checkboxes (display-only)
  - Horizontal rules
  - Images with max-width: 100%
  - Links with appropriate styling

**Checkpoint**: Chat messages render markdown. User Story 1 is independently testable.

---

## Phase 4: User Story 2 - Edit Prompt with Markdown Preview (Priority: P2)

**Goal**: Prompt textarea shows raw markdown when focused, rendered preview when unfocused

**Independent Test**: Type `**bold**` in prompt textarea, click outside, verify rendered bold appears. Click back to verify raw markdown returns.

### Implementation for User Story 2

- [x] T011 [US2] Create MarkdownField component in `src/components/MarkdownField.js` with:
  - Constructor accepting container and options (value, placeholder, className, rows, disabled, onChange, onFocus, onBlur)
  - Private `#isEditing` state (boolean)
  - Private `#value` state (string)
  - Private `#renderedHtml` cache (string)
  - `getValue()` method returning raw markdown
  - `setValue(value, rerender)` method
  - `focus()` method switching to edit mode
  - `blur()` method switching to preview mode
  - `isEditing()` method returning current state
  - `setDisabled(disabled)` method
  - `template()` method rendering textarea (editing) or preview div (not editing)
  - `onRender()` method binding focus/blur/click events
  - Event emission for `markdown:change`, `markdown:focus`, `markdown:blur`
- [x] T012 [US2] Add MarkdownField CSS to `src/styles/markdown.css`:
  - `.markdown-field` root container
  - `.markdown-field--editing` and `.markdown-field--preview` state classes
  - `.markdown-field--empty` for placeholder display
  - `.markdown-field--disabled` for disabled state
  - `.markdown-field__textarea` matching existing textarea styles
  - `.markdown-field__preview` with same dimensions as textarea
  - `.markdown-field__placeholder` for placeholder styling
  - Smooth transitions between states (no layout shift)
- [x] T013 [US2] Refactor PromptPanel in `src/components/PromptPanel.js` to:
  - Import MarkdownField component
  - Replace textarea with MarkdownField in template
  - Update `getPromptText()` to use MarkdownField.getValue()
  - Update `setPromptText()` to use MarkdownField.setValue()
  - Update `focus()` to use MarkdownField.focus()
  - Wire onChange to update appState and stats display
  - Handle maximized state with MarkdownField
- [x] T014 [US2] Update PromptPanel onRender in `src/components/PromptPanel.js` to:
  - Initialize MarkdownField with current prompt text
  - Bind markdown:change event to update character/word stats without full re-render
  - Handle focus/blur events appropriately

**Checkpoint**: Prompt panel has edit/preview toggle. User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Edit Chat Input with Markdown Preview (Priority: P3)

**Goal**: Chat input textarea shows raw markdown when focused, rendered preview when unfocused

**Independent Test**: Type `**bold**` in chat input, click outside, verify rendered preview. Click back to continue editing. Submit and verify message renders in chat.

### Implementation for User Story 3

- [x] T015 [US3] Refactor InputPanel in `src/components/InputPanel.js` to:
  - Import MarkdownField component
  - Replace textarea with MarkdownField in template (both normal and maximized views)
  - Update `getInputText()` to use MarkdownField.getValue()
  - Update `clearInput()` to use MarkdownField.setValue('')
  - Update `focus()` to use MarkdownField.focus()
  - Wire onChange for any needed state updates
- [x] T016 [US3] Update InputPanel onRender in `src/components/InputPanel.js` to:
  - Initialize MarkdownField with appropriate placeholder
  - Handle send button click using MarkdownField.getValue()
  - Handle Enter/Ctrl+Enter key events
  - Clear field after successful send
- [x] T017 [US3] Handle InputPanel maximized state in `src/components/InputPanel.js`:
  - Ensure MarkdownField works correctly in maximized view
  - Maintain edit/preview state across maximize/restore

**Checkpoint**: Chat input has edit/preview toggle. All user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, accessibility, and refinements

- [x] T018 [P] Add empty state handling in MarkdownField - show placeholder when value is empty/whitespace in `src/components/MarkdownField.js`
- [x] T019 [P] Add accessibility attributes in `src/components/MarkdownField.js`:
  - `aria-label` on textarea
  - `role="textbox"` and `aria-readonly="true"` on preview div
  - `tabindex="0"` on preview for keyboard navigation
- [x] T020 [P] Add Escape key handler to blur MarkdownField in `src/components/MarkdownField.js`
- [x] T021 [P] Add performance logging for large content (>50KB) in `src/services/MarkdownService.js`
- [x] T022 Verify XSS protection by testing with `<script>alert(1)</script>` input
- [x] T023 Verify layout shift is <5px during focus/blur transitions
- [x] T024 Run quickstart.md validation - verify all implementation steps work

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (MarkdownService)
    ↓
    ├── Phase 3: User Story 1 (Chat rendering)
    ├── Phase 4: User Story 2 (Prompt edit/preview) 
    └── Phase 5: User Story 3 (Input edit/preview)
              ↓
        Phase 6: Polish
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Chat) | Phase 2 only | US2, US3 (after Phase 2) |
| US2 (Prompt) | Phase 2 only | US1, US3 (after Phase 2) |
| US3 (Input) | Phase 2 + MarkdownField from US2 | US1 |

**Note**: US3 reuses MarkdownField created in US2, so US2 should complete first (or MarkdownField extracted to Phase 2).

### Within Each User Story

1. Models/entities first (if any)
2. Component modifications
3. Styling updates
4. Integration verification

### Parallel Opportunities

**Phase 1** (all parallel):
- T002 and T003 can run in parallel

**Phase 3 - US1** (sequential due to dependencies):
- T006 → T007 → T008 → T009 → T010

**Phase 4 - US2** (mostly sequential):
- T011 → T012 (parallel) → T013 → T014

**Phase 6 - Polish** (all parallel):
- T018, T019, T020, T021 can all run in parallel

---

## Parallel Example: Phase 1 Setup

```bash
# Can run simultaneously:
Task T002: "Create markdown styles file in src/styles/markdown.css"
Task T003: "Import markdown.css in main stylesheet or entry point"
```

## Parallel Example: Phase 6 Polish

```bash
# Can run simultaneously:
Task T018: "Add empty state handling in MarkdownField"
Task T019: "Add accessibility attributes in MarkdownField"
Task T020: "Add Escape key handler to blur MarkdownField"
Task T021: "Add performance logging for large content"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T010)
4. **STOP and VALIDATE**: Verify chat messages render markdown correctly
5. Deploy/demo if ready - users get immediate value from readable chat

### Incremental Delivery

1. **Setup + Foundational** → MarkdownService ready
2. **Add User Story 1** → Chat renders markdown → Deploy (MVP!)
3. **Add User Story 2** → Prompt has edit/preview → Deploy
4. **Add User Story 3** → Input has edit/preview → Deploy
5. **Polish** → Edge cases and accessibility → Final release

### Recommended Sequence (Single Developer)

```
T001 → T002 → T003 → T004 → T005 (Foundation complete)
  → T006 → T007 → T008 → T009 → T010 (US1 complete - MVP!)
  → T011 → T012 → T013 → T014 (US2 complete)
  → T015 → T016 → T017 (US3 complete)
  → T018 → T019 → T020 → T021 → T022 → T023 → T024 (Polish)
```

---

## Notes

- Total tasks: **24**
- US1 tasks: **5** (T006-T010)
- US2 tasks: **4** (T011-T014)
- US3 tasks: **3** (T015-T017)
- Setup/Foundation: **5** (T001-T005)
- Polish: **7** (T018-T024)
- Parallel opportunities: **8 tasks** marked [P]
- MVP scope: Phase 1 + Phase 2 + Phase 3 (13 tasks)
- MarkdownField component (T011) is reused by both US2 and US3
