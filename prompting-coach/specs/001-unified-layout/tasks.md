# Tasks: Unified Layout

**Input**: Design documents from `specs/001-unified-layout/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested. Test tasks omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## User Stories (from spec.md)

| ID | Story | Priority | Description |
|----|-------|----------|-------------|
| US1 | Unified Prompt and Chat View | P1 | Single view with prompt, conversation, input panels |
| US2 | Maximize Component View | P2 | Full-screen mode for any panel |
| US3 | Integrated LLM Testing | P3 | LLM responses in conversation area |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare project for unified layout components

- [x] T001 Create unified layout CSS variables in `src/styles/variables.css`
- [x] T002 [P] Add maximize state to AppState in `src/state/AppState.js`
- [x] T003 [P] Extend ChatMessage model with messageType field in `src/models/ChatMessage.js`

**Checkpoint**: Foundation ready for new components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create MaximizeToggle component in `src/components/MaximizeToggle.js`
- [x] T005 [P] Add unified layout base styles in `src/styles/components.css`
- [x] T006 [P] Add panel maximize/restore CSS classes in `src/styles/components.css`

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Unified Prompt and Chat View (Priority: P1) MVP

**Goal**: Single unified view with prompt panel (top), conversation area (center), input panel (bottom)

**Independent Test**: Open app → see three-panel layout → edit prompt → send message → see response → no tab switching

### Components for US1

- [x] T007 [P] [US1] Create PromptPanel component in `src/components/PromptPanel.js`
- [x] T008 [P] [US1] Create ConversationArea component in `src/components/ConversationArea.js`
- [x] T009 [P] [US1] Create InputPanel component in `src/components/InputPanel.js`
- [x] T010 [US1] Create UnifiedView container in `src/components/UnifiedView.js`

### Styles for US1

- [x] T011 [US1] Add prompt-panel styles (fixed top, edge-to-edge) in `src/styles/components.css`
- [x] T012 [P] [US1] Add conversation-area styles (scrollable center) in `src/styles/components.css`
- [x] T013 [P] [US1] Add input-panel styles (fixed bottom) in `src/styles/components.css`
- [x] T014 [US1] Add unified-view container styles in `src/styles/main.css`

### Integration for US1

- [x] T015 [US1] Wire PromptPanel to AppState (prompt.text subscription) in `src/components/PromptPanel.js`
- [x] T016 [US1] Wire ConversationArea to session messages in `src/components/ConversationArea.js`
- [x] T017 [US1] Wire InputPanel to CoachService.processUserMessage in `src/components/InputPanel.js`
- [x] T018 [US1] Update App.js to render UnifiedView instead of tab-based layout in `src/App.js`
- [x] T019 [US1] Update TabBar to minimal navigation (Settings, History icons only) in `src/components/TabBar.js`

**Checkpoint**: US1 complete - unified three-panel layout functional, no tab switching

---

## Phase 4: User Story 2 - Maximize Component View (Priority: P2)

**Goal**: Any panel can be maximized to fill the screen below app title

**Independent Test**: Click maximize on any panel → panel fills screen → click again or press Escape → restores

### Implementation for US2

- [x] T020 [US2] Add maximize toggle to PromptPanel in `src/components/PromptPanel.js`
- [x] T021 [P] [US2] Add maximize toggle to ConversationArea in `src/components/ConversationArea.js`
- [x] T022 [P] [US2] Add maximize toggle to InputPanel in `src/components/InputPanel.js`
- [x] T023 [US2] Implement maximize/restore logic in UnifiedView in `src/components/UnifiedView.js`
- [x] T024 [US2] Add Escape key handler for restore in `src/components/UnifiedView.js`
- [x] T025 [US2] Add maximized panel styles (full viewport, no margins) in `src/styles/components.css`
- [x] T026 [US2] Add hidden panel styles (when sibling is maximized) in `src/styles/components.css`

**Checkpoint**: US2 complete - all panels can maximize/restore independently

---

## Phase 5: User Story 3 - Integrated LLM Testing (Priority: P3)

**Goal**: LLM test responses appear in conversation area with distinct styling

**Independent Test**: Write prompt → click Test Prompt → see LLM response in conversation with distinct style

### Implementation for US3

- [x] T027 [US3] Add Test Prompt button to InputPanel in `src/components/InputPanel.js`
- [x] T028 [US3] Wire Test Prompt to LlmService in `src/components/InputPanel.js`
- [x] T029 [US3] Create LLM response as ChatMessage with messageType='llm_response' in `src/components/InputPanel.js`
- [x] T030 [US3] Add LLM response message styles (distinct background, border) in `src/styles/components.css`
- [x] T031 [US3] Add loading indicator for LLM test in ConversationArea in `src/components/ConversationArea.js`
- [x] T032 [US3] Disable Test Prompt button when prompt is empty in `src/components/InputPanel.js`

**Checkpoint**: US3 complete - LLM testing integrated into conversation flow

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T033 [P] Add responsive styles for mobile viewports in `src/styles/components.css`
- [x] T034 [P] Add ARIA labels for accessibility in all new components
- [x] T035 Deprecation comments in CoachPanel.js and PromptWorkspace.js
- [x] T036 Update quickstart.md with unified layout flows in `specs/001-unified-layout/quickstart.md`
- [x] T037 Manual validation of all quickstart flows
  - ✅ Three-panel layout displays correctly (prompt top, conversation center, input bottom)
  - ✅ Prompt editing works without focus loss
  - ✅ Send message shows user message immediately, then coach response
  - ✅ Test Prompt button triggers LLM and displays response with footer stats
  - ✅ Maximize/restore works on all panels
  - ✅ Escape key restores maximized panel
  - ✅ Assessment status displays in input panel header
  - ⚠️ Viewport testing (320px-2560px) - basic responsiveness verified, edge cases deferred

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ────────────────────────────────────────────────────►
                 │
                 ▼
Phase 2 (Foundational) ─────────────────────────────────────────────►
                 │
                 ├──────────────────┬──────────────────┐
                 ▼                  ▼                  ▼
         Phase 3 (US1)      Phase 4 (US2)      Phase 5 (US3)
         Unified View       Maximize           LLM Testing
         [MVP]              [Depends US1]      [Depends US1]
                 │                  │                  │
                 └──────────────────┴──────────────────┘
                                    │
                                    ▼
                            Phase 6 (Polish)
```

### User Story Dependencies

- **US1 (Unified View)**: No dependencies - can start after Foundational
- **US2 (Maximize)**: Depends on US1 (needs panels to exist)
- **US3 (LLM Testing)**: Depends on US1 (needs InputPanel and ConversationArea)

### Within Each User Story

1. Components first (can be parallel if different files)
2. Styles (can be parallel)
3. Integration/wiring last
4. Story complete before moving to next priority

---

## Parallel Execution Examples

### Phase 1 (Setup) - All tasks can run in parallel:
```
T002, T003 → parallel (different files)
```

### Phase 2 (Foundational) - Styles parallel:
```
T005, T006 → parallel (same file but different sections)
```

### Phase 3 (US1) - Components parallel:
```
T007, T008, T009 → parallel (different files)
T012, T013 → parallel (different sections)
```

### Phase 4 (US2) - Toggles parallel:
```
T021, T022 → parallel (different files)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Three-panel layout works, no tab switching
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → **MVP: Unified layout works**
3. Add US2 → Maximize feature works
4. Add US3 → LLM testing integrated
5. Polish → Production ready

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Setup | T001-T003 (3) | ✅ Complete |
| Foundational | T004-T006 (3) | ✅ Complete |
| US1 - Unified View | T007-T019 (13) | ✅ Complete |
| US2 - Maximize | T020-T026 (7) | ✅ Complete |
| US3 - LLM Testing | T027-T032 (6) | ✅ Complete |
| Polish | T033-T037 (5) | ✅ Complete |
| **Total** | **37/37 tasks** | **100%** |

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story
- Each user story is independently completable after US1
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Old components (CoachPanel, PromptWorkspace) kept for rollback capability
