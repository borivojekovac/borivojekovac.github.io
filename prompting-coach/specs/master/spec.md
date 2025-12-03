# Feature Specification: Prompting Coach PWA

**Feature Branch**: `master`  
**Created**: 2025-12-02  
**Status**: In Progress (US1 Complete, US2/CR001 In Progress)  
**Input**: PWA that coaches users on writing effective prompts using AIM/MAP/DEBUG/OCEAN methodology

## Overview

A Progressive Web App that helps users craft better prompts for Large Language Models through:
1. **Prompt Workspace** - Write, edit, and test prompts against LLMs with instant feedback
2. **Coaching Assistant** - Guided coaching through AIM/MAP/DEBUG/OCEAN principles
3. **Session History** - Track, search, and manage past coaching sessions

The app runs entirely in the browser with no backend server, storing data locally and making direct API calls to LLM providers.

## Clarifications

### Session 2025-12-03

- Q: How should users access the History panel? → A: Hamburger menu (top-right) with Material Design drawer containing Settings and History options
- Q: What layout pattern should the History screen use? → A: Vertical list of session cards with search bar at top
- Q: What actions should be available on each session card? → A: Star toggle only (load on card click, delete via swipe/long-press)
- Q: How should search and filters be presented in History? → A: Search bar + filter chips below (Starred, tag chips)
- Q: What information should each session card show? → A: Title + date + star + prompt preview + principle completion %

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Prompt Editing (Priority: P1) ✅ IMPLEMENTED

A user opens the app and writes a prompt in the workspace. They can test it against an LLM to see the response, refine the prompt based on results, and their work persists across browser refreshes.

**Why this priority**: Core functionality - without prompt editing and testing, no other features are useful. This is the MVP.

**Independent Test**: Open app → type prompt → refresh page → prompt restored → configure API key → click Run Test → see LLM response

**Acceptance Scenarios**:

1. **Given** the app is open, **When** user types in the prompt textarea, **Then** text appears and character/word count updates
2. **Given** a prompt exists, **When** user refreshes the page, **Then** prompt text is restored from storage
3. **Given** a valid API key is configured, **When** user clicks "Run Test", **Then** LLM response appears in the output section
4. **Given** no API key is configured, **When** user views the workspace, **Then** a configuration warning is displayed
5. **Given** a test is running, **When** user waits, **Then** loading state is shown and response time/token count displayed on completion
6. **Given** the workspace is displayed, **When** user clicks focus toggle on a section, **Then** that section expands to fill the panel

---

### User Story 2 - Coaching Session (Priority: P2) - Enhanced by [CR001](changes/CR001-conversational-coaching.md)

A user wants guided help improving their prompt. They start a coaching session and engage in natural conversation with the coach, who internally evaluates their prompt against AIM/MAP/DEBUG/OCEAN principles without exposing the framework. The coach uses Socratic questioning to guide improvements.

**Why this priority**: Primary differentiating feature - transforms the app from a simple prompt tester into a coaching tool.

**Independent Test**: Click "Start Coaching" → see natural greeting with feedback → chat with coach → say "skip" or update prompt → continue until complete → see summary

**Acceptance Scenarios** (Updated for CR001):

1. **Given** a prompt exists, **When** user clicks "Start Coaching", **Then** coach greets naturally and provides initial observations
2. **Given** a coaching session is active, **When** coach identifies an area for improvement, **Then** coach asks guiding questions (not direct rewrites)
3. **Given** user says "skip" or "move on", **When** processed, **Then** coach acknowledges and moves to next topic
4. **Given** user pushes back ("already covered", "it's fine"), **When** processed, **Then** coach respects judgment and moves on
5. **Given** user says "I updated it" or "check again", **When** processed, **Then** coach re-evaluates from current principle
6. **Given** all principles pass or are skipped, **When** session completes, **Then** natural summary highlights improvements
7. **Given** a coaching session is in progress, **When** user navigates away, **Then** session state is preserved for later resumption
8. **Given** user returns to unfinished session, **When** coach tab opens, **Then** resume or start fresh option is shown

---

### User Story 3 - Session History (Priority: P3)

A user wants to review past coaching sessions to learn from previous improvements or reuse refined prompts. They can search, filter by tags or starred status, and load previous prompts back into the editor.

**Why this priority**: Enables learning over time and prompt reuse, but requires completed sessions to be useful.

**Navigation**: Hamburger menu icon (top-right header) opens Material Design drawer with Settings and History options.

**History Screen Design**:
- Vertical list of session cards with search bar at top
- Filter chips below search bar (Starred toggle, tag chips)
- Each card displays: title, date, star icon, prompt preview (truncated), principle completion %
- Card interactions: tap card to load session, tap star to toggle, swipe/long-press to delete

**Independent Test**: Complete a coaching session → tap hamburger menu → tap History → see session card with title/date/completion % → star it → search by text → filter by starred → tap card to load prompt into editor

**Acceptance Scenarios**:

1. **Given** completed sessions exist, **When** user opens History via drawer menu, **Then** sessions are listed as cards with title, date, star, prompt preview, and completion %
2. **Given** a session is displayed, **When** user clicks the star icon, **Then** the session is marked as starred
3. **Given** multiple sessions exist, **When** user enters search text, **Then** sessions matching title/prompt/summary are shown
4. **Given** sessions have tags, **When** user filters by tag, **Then** only sessions with that tag are displayed
5. **Given** a session card is displayed, **When** user taps the card, **Then** the prompt is restored to the workspace and drawer closes
6. **Given** a session card is displayed, **When** user swipes or long-presses, **Then** delete confirmation is shown and session is removed on confirm

---

### User Story 4 - Multi-Provider Support (Priority: P4)

A user wants to test their prompts against different LLM providers (OpenAI, Google Gemini, Anthropic Claude, xAI Grok) to compare responses or use their preferred provider.

**Why this priority**: Extends flexibility but OpenAI alone provides full functionality.

**Independent Test**: Go to Settings → add Google API key → select Google as provider → test prompt → see Gemini response

**Acceptance Scenarios**:

1. **Given** the settings dialog is open, **When** user enters API keys for multiple providers, **Then** keys are saved securely in local storage
2. **Given** multiple providers are configured, **When** user selects a different provider, **Then** subsequent tests use that provider
3. **Given** a provider is selected, **When** user views available models, **Then** models for that provider are listed
4. **Given** an invalid API key is entered, **When** user tests, **Then** a clear error message indicates the authentication failure

---

### User Story 5 - File Attachments (Priority: P5)

A user wants to include file content as context for their prompt (e.g., code files, documentation, data samples). They can attach text files that are included when testing the prompt.

**Why this priority**: Enhances prompt context but not essential for core coaching flow.

**Independent Test**: Click upload → select .txt file → see file in attachment list → test prompt → file content included in LLM context

**Acceptance Scenarios**:

1. **Given** the workspace is displayed, **When** user clicks upload or drags a file, **Then** file selection dialog opens or file is accepted
2. **Given** a valid file is selected, **When** file is under size limit and supported type, **Then** file appears in attachment list
3. **Given** an invalid file is selected, **When** file exceeds limits, **Then** clear error message explains the restriction
4. **Given** files are attached, **When** user runs a test, **Then** file contents are included in the prompt context
5. **Given** a file is attached, **When** user clicks remove, **Then** file is removed from the list

---

### Edge Cases

- **Empty prompt**: System prevents testing with empty prompt text
- **API key missing**: Clear warning displayed, test button disabled
- **Network failure**: Error message displayed with retry option
- **Large prompt**: Warning when prompt exceeds soft limit (10,000 chars), hard limit enforced (50,000 chars)
- **File too large**: Rejection with clear message when file exceeds 100KB or total attachments exceed 500KB
- **Unsupported file type**: Only text/plain, text/markdown, application/json, text/csv accepted
- **Session interrupted**: Active work state persisted for recovery on refresh
- **Storage full**: Graceful degradation with warning when localStorage/IndexedDB limits reached

## Requirements *(mandatory)*

### Functional Requirements

#### Prompt Management
- **FR-001**: System MUST allow users to enter and edit prompt text in a textarea
- **FR-002**: System MUST display real-time character and word count for the prompt
- **FR-003**: System MUST persist prompt text to local storage automatically (debounced)
- **FR-004**: System MUST restore prompt text on page load/refresh
- **FR-005**: System MUST allow users to clear the current prompt

#### LLM Testing
- **FR-006**: System MUST send prompts to configured LLM provider and display responses
- **FR-007**: System MUST display loading state during LLM API calls
- **FR-008**: System MUST display response time and token usage after successful tests
- **FR-009**: System MUST display clear error messages for failed API calls
- **FR-010**: System MUST allow copying LLM response to clipboard

#### Settings & Configuration
- **FR-011**: System MUST provide a settings dialog for API key configuration
- **FR-012**: System MUST support multiple LLM providers (OpenAI, Google, Anthropic, xAI)
- **FR-013**: System MUST allow selection of provider and model
- **FR-014**: System MUST store API keys in local storage with security warning
- **FR-015**: System MUST validate API key format before saving

#### Coaching (US2) - Enhanced by [CR001](changes/CR001-conversational-coaching.md)
- **FR-016**: System MUST implement AIM/MAP/DEBUG/OCEAN coaching principles (internally, not exposed to user)
- **FR-017**: System MUST evaluate prompts against each principle using LLM with structured JSON responses
- **FR-018**: System MUST provide conversational feedback via natural language chat (no wizard UI)
- **FR-019**: System MUST detect user intent from messages (skip, progress check, pushback, prompt update)
- **FR-020**: System MUST generate session summary on completion with key improvements highlighted
- **FR-020a**: System MUST respect user pushback - accept principles when user indicates they're satisfied
- **FR-020b**: System MUST use LLM-driven structured responses with `principle_status` and `prompt_updated` fields
- **FR-020c**: System MUST batch passing principles and stop on first failure for focused coaching

#### History (US3)
- **FR-021**: System MUST store completed coaching sessions
- **FR-022**: System MUST allow searching sessions by text content
- **FR-023**: System MUST allow filtering sessions by tags and starred status
- **FR-024**: System MUST allow starring/unstarring sessions
- **FR-025**: System MUST allow loading previous prompts into workspace
- **FR-026**: System MUST allow deleting sessions with confirmation

#### File Attachments (US5)
- **FR-027**: System MUST accept file uploads via click or drag-and-drop
- **FR-028**: System MUST validate file type (text/plain, text/markdown, application/json, text/csv)
- **FR-029**: System MUST enforce file size limits (100KB per file, 500KB total)
- **FR-030**: System MUST include attached file content in LLM prompt context

#### UI/UX
- **FR-031**: System MUST provide a unified single-view layout with prompt panel (top), conversation area (center), and input panel (bottom) - no tab switching for core workflow
- **FR-031a**: System MUST provide hamburger menu icon (top-right) opening Material Design drawer with Settings and History options
- **FR-031b**: History screen MUST display vertical list of session cards with search bar and filter chips (Starred, tags)
- **FR-031c**: Session cards MUST show title, date, star icon, prompt preview (truncated), and principle completion percentage
- **FR-032**: System MUST support maximize toggle on each panel (prompt, conversation, input) for focused editing/viewing
- **FR-033**: System MUST support keyboard shortcuts (Ctrl+Enter to test)
- **FR-034**: System MUST be responsive for mobile devices
- **FR-035**: System MUST support light/dark theme based on system preference

### Non-Functional Requirements

- **NFR-001**: Initial page load MUST complete in under 2 seconds
- **NFR-002**: UI interactions MUST respond in under 100ms
- **NFR-003**: Application MUST work offline for UI (LLM features require network)
- **NFR-004**: Bundle size MUST be under 100KB gzipped
- **NFR-005**: Application MUST be installable as PWA

### Key Entities

- **Prompt**: User's prompt text with optional title and attached files
- **AttachedFile**: File uploaded as context (name, type, size, content)
- **CoachingSession**: Active or completed coaching session with principle results and chat history
- **Principle**: Coaching principle from AIM/MAP/DEBUG/OCEAN frameworks
- **PrincipleResult**: Evaluation result for a single principle (satisfied, feedback, suggestions)
- **ChatMessage**: Message in coaching conversation with messageType (user, coach, system, llm_response)
- **LlmTestResult**: Record of a prompt test (provider, model, response, timing, tokens)
- **AppSettings**: User preferences (provider, model, API keys, theme, log level)
- **UnifiedView**: Main application view containing prompt panel, conversation area, and input panel
- **Panel**: A UI region (prompt, conversation, or input) with maximize capability
- **MaximizeState**: Tracks which panel (if any) is currently maximized

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can write a prompt and test it against an LLM in under 30 seconds (after initial setup)
- **SC-002**: Prompt text persists across page refresh with 100% reliability
- **SC-003**: Users can complete a full coaching session (all principles) in under 15 minutes
- **SC-004**: Users can find a previous session via search in under 10 seconds
- **SC-005**: Application loads and becomes interactive in under 2 seconds on 3G connection
- **SC-006**: 95% of user actions complete without errors
- **SC-007**: Users can configure API keys and start testing within 2 minutes of first visit

## Assumptions

- Users have their own API keys for LLM providers
- Users understand basic prompt engineering concepts
- Modern browser with ES2022+ support (Chrome, Firefox, Safari, Edge)
- Network connectivity available for LLM API calls
- Local storage available and not blocked by browser settings

## Out of Scope

- Backend server or database
- User authentication or accounts
- Sharing prompts between users
- Prompt templates or library
- Cost tracking for API usage
- Real-time collaboration
