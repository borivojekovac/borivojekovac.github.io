# Tasks: Prompting Coach PWA

**Input**: Design documents from `specs/master/`
**Prerequisites**: [spec.md](spec.md) (required), [plan.md](plan.md), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Unit tests added for models and services. E2E test scaffolding in place.

**Organization**: Tasks organized by user stories from spec.md.

**Note**: UI architecture updated by [001-unified-layout](../001-unified-layout/tasks.md) feature. Components `PromptWorkspace`, `CoachPanel`, and `TabBar` are DEPRECATED. New components: `UnifiedView`, `PromptPanel`, `ConversationArea`, `InputPanel`, `MaximizeToggle`.

## User Stories (from spec.md)

| ID | Story | Priority | Description |
|----|-------|----------|-------------|
| US1 | Basic Prompt Editing | P1 | User can write/edit prompts and test against LLM |
| US2 | Coaching Session | P2 | User receives guided coaching through principles |
| US3 | Session History | P3 | User can view, search, star, and manage past sessions |
| US4 | Multi-Provider Support | P4 | User can switch between LLM providers |
| US5 | File Attachments | P5 | User can attach files as context |

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize project structure and build configuration

- [x] T001 Create project root with `package.json` (name: prompting-coach, type: module)
- [x] T002 [P] Configure Vite in `vite.config.js` with PWA plugin
- [x] T003 [P] Create `index.html` (root level) with semantic HTML shell
- [x] T004 [P] Create `public/manifest.json` for PWA
- [x] T005 [P] Create placeholder PWA icons in `public/icons/`
- [x] T006 [P] Create CSS variables in `src/styles/variables.css` (Material Design tokens)
- [x] T007 [P] Create base styles in `src/styles/main.css`
- [x] T008 Create entry point `src/main.js`
- [x] T009 Create `.env.example` with VITE_LOG_LEVEL

**Checkpoint**: Project builds and serves empty shell ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create custom error classes in `src/models/errors/LlmApiError.js`
- [x] T011 [P] Create `src/models/errors/LlmConfigError.js`
- [x] T012 [P] Create `src/models/errors/StorageError.js`
- [x] T013 [P] Create `src/models/errors/ValidationError.js`
- [x] T014 Implement LogService singleton in `src/services/LogService.js` per contract
- [x] T015 Implement StorageService in `src/services/StorageService.js` (IndexedDB init, localStorage)
- [x] T016 Create AppState class in `src/state/AppState.js` (EventTarget, hydration, persistence)
- [x] T017 Create BaseComponent class in `src/components/BaseComponent.js` (lifecycle, render, state subscription)
- [x] T018 Create App root class in `src/App.js` (initializes services, mounts components)
- [x] T019 Create TabBar component in `src/components/TabBar.js` (DEPRECATED - now minimal header with Settings icon)
- [x] T020 [P] Create component styles in `src/styles/components.css`

**Checkpoint**: App shell renders with tabs, state persists across refresh ✅

---

## Phase 3: User Story 1 - Basic Prompt Editing (Priority: P1) 🎯 MVP

**Goal**: User can write prompts, see them persist, and test against an LLM

**Independent Test**: Open app → type prompt → refresh → prompt restored → click Test → see LLM response

### Models for US1

- [x] T021 [P] [US1] Create Prompt model in `src/models/Prompt.js`
- [x] T022 [P] [US1] Create LlmTestResult model in `src/models/LlmTestResult.js`
- [x] T023 [P] [US1] Create AppSettings model in `src/models/AppSettings.js`

### Services for US1

- [x] T024 [US1] Create OpenAI adapter in `src/services/adapters/OpenAiAdapter.js`
- [x] T025 [US1] Create LlmService in `src/services/LlmService.js` (single provider for MVP)
- [x] T026 [US1] Add prompt CRUD methods to StorageService in `src/services/StorageService.js`
- [x] T027 [US1] Add settings methods to StorageService (getSettings, saveSettings)
- [x] T028 [US1] Add active work state methods to StorageService (refresh recovery)

### Components for US1

- [x] T029 [US1] ~~Create PromptWorkspace component~~ DEPRECATED by 001-unified-layout
  - **REPLACED BY**: `UnifiedView`, `PromptPanel`, `ConversationArea`, `InputPanel` (see [001-unified-layout tasks](../001-unified-layout/tasks.md))
  - New layout: Prompt panel (top), Conversation area (center), Input panel (bottom)
  - Maximize toggle on each panel for focused editing
- [x] T030 [US1] ~~Create TestPanel component~~ (functionality in InputPanel + ConversationArea)
- [x] T031 [US1] Create SettingsDialog component in `src/components/SettingsDialog.js` (API key input, provider select)
- [x] T032 [US1] Wire PromptPanel to AppState (auto-save draft on change)
- [x] T033 [US1] Wire InputPanel to LlmService (send prompt, display response in ConversationArea)
- [x] T034 [US1] Add loading states and error handling to UnifiedView components

**Checkpoint**: User Story 1 complete - can write prompt, test it, refresh without losing work ✅

---

## Phase 4: User Story 2 - Coaching Session (Priority: P2)

**Goal**: User receives guided coaching through AIM/MAP/DEBUG/OCEAN principles

**Independent Test**: Click Start Coaching → see first principle → get feedback → improve prompt → advance to next principle

### Config for US2

- [x] T035 [US2] Create principles configuration in `src/config/principles.js` (all AIM/MAP/DEBUG/OCEAN)

### Models for US2

- [x] T036 [P] [US2] Create Principle model in `src/models/Principle.js`
- [x] T037 [P] [US2] Create CoachingSession model in `src/models/CoachingSession.js`
- [x] T038 [P] [US2] Create PrincipleResult model in `src/models/PrincipleResult.js`
- [x] T039 [P] [US2] Create ChatMessage model in `src/models/ChatMessage.js`

### Services for US2

- [x] T040 [US2] Create CoachService in `src/services/CoachService.js` per contract
- [x] T041 [US2] Implement startSession method in CoachService
- [x] T042 [US2] Implement evaluateCurrentPrinciple method in CoachService (LLM call)
- [x] T043 [US2] Implement advanceToNextPrinciple method in CoachService
- [x] T044 [US2] Implement sendCoachMessage method in CoachService (chat interaction)
- [x] T045 [US2] Add session CRUD methods to StorageService

### Components for US2

- [x] T046 [US2] ~~Create CoachPanel component~~ DEPRECATED - functionality moved to `ConversationArea` (see 001-unified-layout)
- [x] T047 [US2] Implement principle progress indicator in CoachPanel
- [x] T048 [US2] Implement chat message list in CoachPanel
- [x] T049 [US2] Implement chat input in CoachPanel
- [x] T050 [US2] Add Start Coaching button to PromptWorkspace
- [x] T051 [US2] Wire CoachPanel to CoachService and AppState
- [x] T052 [US2] Implement session completion flow (summary generation, final prompt capture)

**Checkpoint**: User Story 2 complete - full coaching flow works, sessions saved

---

## Phase 4b: CR001 - Conversational Coaching Refactor

**Goal**: Transform coaching from wizard-like UI to natural conversation (see [CR001](changes/CR001-conversational-coaching.md))

**Key Changes**: Hide AIM/MAP/DEBUG/OCEAN framework from user, LLM-driven intent detection, structured responses with principle status

### Core Refactor (CR001)

- [x] CR1-001 [US2] Update `CoachingSession` model with evaluationState, pendingFeedback, conversationContext, promptBaseline
- [x] CR1-002 [US2] Create `EvaluationState` type (status: pending/passed/failed/skipped)
- [x] CR1-003 [US2] Update `PrincipleResult` model with observations array
- [x] CR1-004 [US2] Refactor `CoachService` - remove old wizard methods
- [x] CR1-005 [US2] Implement `CoachService.processUserMessage()` - main entry point
- [x] CR1-006 [US2] Implement LLM-based intent detection with structured response
- [x] CR1-007 [US2] Implement `evaluateFromCurrent()` - batch evaluate until failure
- [x] CR1-008 [US2] Implement `detectPromptChange()` - similarity detection
- [x] CR1-009 [US2] Update `startSession()` with auto-evaluation and natural opening

### LLM Integration (CR001)

- [x] CR1-010 [US2] Create evaluation prompt template (structured JSON output)
- [x] CR1-011 [US2] Create response generation prompt with Socratic guidelines
- [x] CR1-012 [US2] Create progress summary prompt template
- [x] CR1-013 [US2] Create session completion prompt template
- [x] CR1-014 [US2] Implement `evaluatePrinciple()` with lenient evaluation
- [x] CR1-015 [US2] Implement `generateCoachResponse()` with context
- [x] CR1-016 [US2] Add structured response parsing (principle_status, prompt_updated)

### UI Simplification (CR001)

- [x] CR1-017 [US2] Remove wizard UI elements from `CoachPanel`
- [x] CR1-018 [US2] Simplify `CoachPanel.template()` to chat-only
- [x] CR1-019 [US2] Update welcome screen (remove framework badges)
- [x] CR1-020 [US2] Implement session resume UI
- [x] CR1-021 [US2] Implement session complete UI
- [x] CR1-022 [US2] Update `CoachPanel` event handlers for chat flow
- [x] CR1-023 [US2] Handle loading states (typing indicator, scroll)

### Session Persistence (CR001)

- [x] CR1-024 [US2] Ensure session auto-saves after each interaction
- [x] CR1-025 [US2] Silently restore active session on page refresh (no prompts)
- [x] CR1-026 [US2] ~~Handle prompt change during inactive session~~ (deferred - new session via menu)
- [x] CR1-027 [US2] Clean up completed/abandoned sessions

> **Note**: CR1-025/CR1-026 simplified - page refresh silently restores session state.
> Starting a new session is an intentional action via burger menu (future feature).
> See `CR001-conversational-coaching.md` Section 8 for details.

### Testing (CR001)

- [x] CR1-028 [US2] Unit tests for intent detection
- [x] CR1-029 [US2] Unit tests for batch evaluation logic
- [x] CR1-030 [US2] Unit tests for prompt change detection
- [x] CR1-031 [US2] Unit tests for session state management
- [x] CR1-032 [US2] Integration tests for conversation flow
- [x] CR1-033 [US2] Integration tests for skip and progress flows
- [x] CR1-034 [US2] E2E test: complete coaching session
- [x] CR1-035 [US2] E2E test: session resume after refresh

**Checkpoint**: CR001 complete - conversational coaching with hidden framework

---

## Phase 5: User Story 3 - Session History (Priority: P3)

**Goal**: User can view past sessions, search/filter, star favorites, manage tags

**Independent Test**: Complete a session → go to History → see session → star it → search by text → filter by starred

### Models for US3

- [x] T053 [P] [US3] Create SessionSearchQuery model in `src/models/SessionSearchQuery.js`
- [x] T054 [P] [US3] Create SessionSearchResult model in `src/models/SessionSearchResult.js`

### Services for US3

- [x] T055 [US3] Add searchSessions method to StorageService
- [x] T056 [US3] Add toggleSessionStar method to StorageService
- [x] T057 [US3] Add tag management methods to StorageService (addTags, removeTags, getAllTags)
- [x] T058 [US3] Add getRecentSessions, getStarredSessions methods to StorageService

### Components for US3

- [x] T059 [US3] Create SearchBar component in `src/components/SearchBar.js` (text input, filter dropdowns)
- [x] T060 [US3] Create SessionCard component in `src/components/SessionCard.js` (title, date, star, tags, actions)
- [x] T061 [US3] Create HistoryPanel component in `src/components/HistoryPanel.js`
- [x] T062 [US3] Implement session list with pagination in HistoryPanel
- [x] T063 [US3] Implement star toggle in SessionCard
- [x] T064 [US3] Implement tag editing in SessionCard
- [x] T065 [US3] Implement "Load Session" action (restore prompt to editor)
- [x] T066 [US3] Implement "Delete Session" action with confirmation
- [x] T067 [US3] Wire SearchBar filters to HistoryPanel

**Checkpoint**: User Story 3 complete - full history management works

---

## Phase 6: User Story 4 - Multi-Provider Support (Priority: P4)

**Goal**: User can switch between OpenAI, Google Gemini, and other LLM providers

**Independent Test**: Go to Settings → add Google API key → switch provider → test prompt → see Gemini response

### Services for US4

- [x] T068 [P] [US4] Create GoogleAdapter in `src/services/adapters/GoogleAdapter.js`
- [x] T069 [P] [US4] Create AnthropicAdapter in `src/services/adapters/AnthropicAdapter.js`
- [x] T070 [P] [US4] Create XaiAdapter in `src/services/adapters/XaiAdapter.js`
- [x] T071 [US4] Update LlmService to support multiple adapters with provider switching
- [x] T072 [US4] Implement validateApiKey method for each adapter
- [x] T073 [US4] Implement getAvailableModels method for each adapter

### Components for US4

- [x] T074 [US4] Update SettingsDialog with multi-provider API key management
- [x] T075 [US4] Add provider/model selector to PromptPanel or SettingsDialog
- [x] T076 [US4] Add API key validation feedback in SettingsDialog

**Checkpoint**: User Story 4 complete - can use multiple LLM providers

---

## Phase 7: User Story 5 - File Attachments (Priority: P5)

**Goal**: User can attach files as context for prompts

**Independent Test**: Click Upload → select .txt file → see file in list → test prompt → file content included in context

### Models for US5

- [x] T077 [US5] Create AttachedFile model in `src/models/AttachedFile.js`

### Services for US5

- [x] T078 [US5] Add file validation utility in `src/utils/fileValidation.js` (size, type checks)
- [x] T079 [US5] Update LlmService to include file context in prompts

### Components for US5

- [x] T080 [US5] Create FileUpload component in `src/components/FileUpload.js`
- [x] T081 [US5] Implement drag-and-drop file upload
- [x] T082 [US5] Implement file list display with remove action
- [x] T083 [US5] Add file size/type validation feedback
- [x] T084 [US5] Wire FileUpload to PromptPanel and AppState

**Checkpoint**: User Story 5 complete - file attachments work

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### UI Chrome & Navigation

- [x] T085a [P] Create burger menu component in header
- [x] T085b [P] Add "New Session" menu item (calls `UnifiedView.startNewSession()`)
- [x] T085c [P] Add "Settings" menu item (opens SettingsDialog)
- [x] T085d [P] Add "History" menu item (navigates to history view - depends on US3)

> **Note**: "New Session" abandons current session and starts fresh.
> See `CR001-conversational-coaching.md` Section 8 for behavior details.

### Responsive & Theming

- [x] T085 [P] Add responsive styles for mobile in `src/styles/responsive.css`
- [x] T086 [P] Implement dark/light theme toggle using CSS variables

### Keyboard & Accessibility

- [x] T087 [P] Add keyboard shortcuts (Ctrl+Enter to test, Escape to close dialogs) - PARTIAL: Ctrl+Enter implemented
- [ ] T092 Accessibility audit: ARIA labels, focus management, screen reader testing

### PWA & Performance (NFR Verification)

**NFR Traceability**:
| NFR | Requirement | Verification Task |
|-----|-------------|-------------------|
| NFR-001 | Initial load <2s | T096 (Lighthouse CI) |
| NFR-002 | UI response <100ms | T096 (Lighthouse CI - TBT/INP metrics) |
| NFR-003 | Offline UI capability | T088 (Service worker) |
| NFR-004 | Bundle <100KB gzipped | T095 (Build verification) |
| NFR-005 | PWA installable | T088a (Install prompt) |

- [ ] T088 [NFR-003] Implement PWA service worker for offline UI capability
- [ ] T088a [NFR-005] Add PWA install prompt/banner for supported browsers
- [ ] T090 Performance optimization: debounce state persistence
- [ ] T091 Add loading skeleton states for async operations
- [ ] T095 [P] [NFR-004] Add bundle size verification to build (fail if >100KB gzipped)
- [ ] T096 [P] [NFR-001, NFR-002] Add Lighthouse CI check for load time (<2s) and UI responsiveness (TBT <200ms, INP <200ms)

### Data & Documentation

- [ ] T089 Add export/import data feature to SettingsDialog
- [x] T093 [P] Create README.md with setup instructions
- [ ] T094 Run quickstart.md validation (manual test of all documented flows)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────────────►
                 │
                 ▼
Phase 2 (Foundational) ──────────────────────────────────────────────►
                 │
                 ├──────────────────┬──────────────────┬──────────────┐
                 ▼                  ▼                  ▼              ▼
         Phase 3 (US1)      Phase 4 (US2)      Phase 5 (US3)   Phase 6 (US4)
         MVP Editing        Coaching           History         Multi-Provider
                 │                  │                  │              │
                 │                  │                  │              │
                 └──────────────────┴──────────────────┴──────────────┘
                                    │
                                    ▼
                            Phase 7 (US5)
                            File Attachments
                                    │
                                    ▼
                            Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (Editing)**: No dependencies - can start after Foundational
- **US2 (Coaching)**: Depends on US1 (needs prompt editing)
- **US3 (History)**: Depends on US2 (needs sessions to display)
- **US4 (Multi-Provider)**: Can run parallel to US2/US3 after US1
- **US5 (Files)**: Can run parallel to US2/US3/US4 after US1

### Within Each User Story

1. Models first (can be parallel)
2. Services (may depend on models)
3. Components (depend on services)
4. Wiring/integration last

---

## Parallel Execution Examples

### Phase 1 (Setup) - All [P] tasks can run in parallel:
```
T002, T003, T004, T005, T006, T007 → all parallel
```

### Phase 2 (Foundational) - Error classes parallel:
```
T010, T011, T012, T013 → all parallel
```

### Phase 3 (US1) - Models parallel:
```
T021, T022, T023 → all parallel
```

### Phase 4 (US2) - Models parallel:
```
T036, T037, T038, T039 → all parallel
```

### Phase 6 (US4) - Adapters parallel:
```
T068, T069, T070 → all parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Can write prompt, test it, refresh works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → App shell works
2. Add US1 → **MVP: Prompt editing + testing**
3. Add US2 → Coaching flow works
4. Add US3 → History management works
5. Add US4 → Multiple providers work
6. Add US5 → File attachments work
7. Polish → Production ready

---

## Summary

| Phase | Tasks | Status | Parallel Opportunities |
|-------|-------|--------|------------------------|
| Setup | T001-T009 (9) | ✅ Complete | 6 parallel |
| Foundational | T010-T020 (11) | ✅ Complete | 5 parallel |
| US1 - Editing | T021-T034 (14) | ✅ Complete | 3 parallel |
| US2 - Coaching | T035-T052 (18) | ✅ Complete | 4 parallel |
| CR001 - Conversational | CR1-001 to CR1-035 (35) | ✅ Complete | 4 parallel |
| US3 - History | T053-T067 (15) | ✅ Complete | 2 parallel |
| US4 - Multi-Provider | T068-T076 (9) | ✅ Complete | 3 parallel |
| US5 - Files | T077-T084 (8) | ✅ Complete | 0 parallel |
| Polish | T085-T096 (12) | 🔄 In Progress (4/12 done) | 6 parallel |
| **Total** | **131 tasks** | | |

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story
- Each user story is independently completable after its dependencies
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
