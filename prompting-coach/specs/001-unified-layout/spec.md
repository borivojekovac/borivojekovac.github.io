# Feature Specification: Unified Layout

**Feature Branch**: `001-unified-layout`  
**Created**: 2025-12-03  
**Status**: Draft  
**Input**: Refactor UI to unified single-view layout eliminating tab switching between workspace and coach

## Overview

The current UI separates prompt editing (Workspace tab) from coaching (Coach tab), requiring users to switch between tabs and wasting screen real estate. This refactor consolidates both features into a single unified view with:

- **Fixed prompt panel** at the top of the screen
- **Scrollable conversation area** in the center for coaching messages and LLM test responses
- **Fixed input panel** at the bottom for user messages
- **Maximize toggle** on each component for focused editing/viewing

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Prompt and Chat View (Priority: P1)

A user opens the app and sees a single unified view. The prompt they're working on is always visible at the top. Below it, a conversation area shows coaching messages, user responses, and LLM test results. At the bottom, an input area lets them type messages or trigger actions. No tab switching is required.

**Why this priority**: Core value proposition - eliminates the clunky tab-switching workflow that wastes time and screen space.

**Independent Test**: Open app → see prompt at top, conversation in middle, input at bottom → type in prompt → send message to coach → see response in conversation → all without switching tabs

**Acceptance Scenarios**:

1. **Given** the app is open, **When** user views the main screen, **Then** prompt panel is visible at top, conversation area in center, input panel at bottom
2. **Given** the unified view is displayed, **When** user edits the prompt, **Then** changes are visible immediately without navigating away
3. **Given** the unified view is displayed, **When** user types a message and sends it, **Then** message appears in conversation area and coach responds
4. **Given** the unified view is displayed, **When** user triggers "Test Prompt", **Then** LLM response appears in the conversation area (styled distinctly from coaching messages)
5. **Given** the conversation area has many messages, **When** user scrolls, **Then** prompt panel and input panel remain fixed in position

---

### User Story 2 - Maximize Component View (Priority: P2)

A user wants to focus on editing a long prompt, reading a detailed LLM response, or composing a complex message. They click a maximize toggle on any component (prompt, conversation, or input) and that component expands to fill the entire screen below the app title, covering all other UI elements.

**Why this priority**: Enables focused work on any component without distraction, critical for long prompts or detailed responses.

**Independent Test**: Click maximize on prompt panel → prompt fills screen → click again to restore → repeat for conversation and input panels

**Acceptance Scenarios**:

1. **Given** the unified view is displayed, **When** user clicks maximize on prompt panel, **Then** prompt panel expands to fill entire screen below app title
2. **Given** a component is maximized, **When** user clicks the toggle again, **Then** component returns to normal size and unified layout is restored
3. **Given** a component is maximized, **When** user presses Escape key, **Then** component returns to normal size
4. **Given** the conversation area is maximized, **When** user views it, **Then** full conversation history is visible with maximum reading space
5. **Given** the input panel is maximized, **When** user types, **Then** they have full screen for composing long messages
6. **Given** one component is maximized, **When** user clicks maximize on a different component, **Then** first component restores and second component maximizes

---

### User Story 3 - Integrated LLM Testing (Priority: P3)

A user wants to test their prompt against the LLM without leaving the coaching flow. They trigger a test and the LLM response appears in the same conversation area as coaching messages, but styled differently so it's clearly distinguishable.

**Why this priority**: Completes the unified experience by integrating prompt testing into the conversation flow.

**Independent Test**: Write prompt → click "Test Prompt" → see LLM response in conversation area with distinct styling → continue coaching conversation

**Acceptance Scenarios**:

1. **Given** a prompt exists, **When** user clicks "Test Prompt" button, **Then** LLM response appears in conversation area
2. **Given** an LLM test response is displayed, **When** user views it, **Then** it is visually distinct from coaching messages (different background, border, or icon)
3. **Given** an LLM test is running, **When** user waits, **Then** loading indicator appears in conversation area
4. **Given** multiple test responses exist in conversation, **When** user scrolls, **Then** all responses are visible in chronological order with coaching messages

---

### Edge Cases

- **Empty prompt**: User can still view conversation and send messages; test button is disabled
- **Very long prompt**: Prompt panel has a maximum height; content scrolls within the panel when not maximized
- **Very long conversation**: Conversation area scrolls independently; auto-scrolls to newest message
- **Maximize during loading**: If LLM call is in progress when maximizing, loading state persists in maximized view
- **Window resize**: Layout adapts responsively; components maintain fixed/scrollable behavior
- **Mobile viewport**: Components stack appropriately; maximize still functions

## Requirements *(mandatory)*

### Functional Requirements

#### Layout Structure
- **FR-001**: System MUST display a unified view with three vertically stacked regions: prompt (top), conversation (center), input (bottom)
- **FR-002**: Prompt panel MUST be fixed to the top of the viewport below the app title
- **FR-003**: Input panel MUST be fixed to the bottom of the viewport
- **FR-004**: Conversation area MUST fill the remaining vertical space and scroll independently
- **FR-005**: System MUST NOT display rounded borders or margins around the main panels (edge-to-edge design)

#### Prompt Panel
- **FR-006**: Prompt panel MUST display the current prompt text in an editable area
- **FR-007**: Prompt panel MUST have a maximum height when not maximized (content scrolls within)
- **FR-008**: Prompt panel MUST include a maximize toggle control
- **FR-009**: Prompt panel MUST display character/word count

#### Conversation Area
- **FR-010**: Conversation area MUST display coaching messages from the coach
- **FR-011**: Conversation area MUST display user messages
- **FR-012**: Conversation area MUST display LLM test responses with distinct visual styling
- **FR-013**: Conversation area MUST auto-scroll to the newest message when new content arrives
- **FR-014**: Conversation area MUST include a maximize toggle control
- **FR-015**: Messages MUST be displayed in chronological order

#### Input Panel
- **FR-016**: Input panel MUST include a text input area for user messages
- **FR-017**: Input panel MUST include a send button
- **FR-018**: ~~Input panel MUST include a "Test Prompt" button~~ **REVISED**: Prompt panel MUST include a "Test Prompt" button to trigger LLM testing (moved for better UX - test relates to prompt, not chat input)
- **FR-019**: Input panel MUST include a maximize toggle control
- **FR-020**: Prompt panel MUST disable "Test Prompt" button when prompt is empty
- **FR-020a**: Input panel MUST display assessment status (e.g., "Not assessed" or "X/Y passed")

#### Maximize Feature
- **FR-021**: Each panel (prompt, conversation, input) MUST have a maximize toggle
- **FR-022**: When maximized, a panel MUST fill the entire viewport below the app title
- **FR-023**: When maximized, a panel MUST cover all other UI elements (no margins, padding, borders)
- **FR-024**: Only one panel MAY be maximized at a time
- **FR-025**: Pressing Escape key MUST restore a maximized panel to normal view
- **FR-026**: Clicking maximize toggle on a maximized panel MUST restore normal view

#### Navigation
- **FR-027**: ~~System MUST retain a minimal navigation element for accessing Settings and History~~ **REVISED**: System MUST provide Settings access via header icon; History feature deferred to future release
- **FR-028**: System MUST remove the Workspace/Coach tab switching paradigm

### Key Entities

- **UnifiedView**: The main application view containing prompt panel, conversation area, and input panel
- **Panel**: A UI region (prompt, conversation, or input) with maximize capability
- **ConversationMessage**: A message in the conversation area with type (coach, user, llm_response), content, and timestamp
- **MaximizeState**: Tracks which panel (if any) is currently maximized

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can edit prompt, send coaching messages, and view responses without any tab switches (0 tab switches for core workflow)
- **SC-002**: Users can maximize any panel and return to normal view in under 2 clicks
- **SC-003**: Prompt panel and input panel remain visible and fixed during conversation scrolling (100% of scroll events)
- **SC-004**: LLM test responses are distinguishable from coaching messages (visual differentiation test)
- **SC-005**: All three panels can be maximized to full screen with no visible margins or padding
- **SC-006**: Layout remains functional on viewports from 320px to 2560px width

## Assumptions

- App title ("Prompting Coach") remains at the very top of the viewport
- Settings and History features are accessed via a secondary navigation mechanism (hamburger menu, icons, or minimal tab bar)
- Existing coaching logic (CoachService) and LLM testing logic (LlmService) remain unchanged
- Session persistence continues to work with the new unified view

## Out of Scope

- Changes to coaching conversation logic or LLM integration
- Mobile-specific UI optimizations beyond basic responsiveness
- Keyboard shortcuts beyond Escape for maximize
- Drag-to-resize panels
- Multiple conversation threads or tabs
