# Implementation Plan: Prompting Coach PWA

**Branch**: `master` | **Date**: 2025-12-02 | **Spec**: [spec.md](spec.md)
**Input**: User requirements for PWA prompt coaching application

## Summary

A Progressive Web App that coaches users on writing effective prompts using the AIM/MAP/DEBUG/OCEAN methodology. Two main areas: (1) Prompt Editor with LLM testing, (2) Coach Assistant that iteratively validates prompts against principles. Supports file uploads for context, multiple LLM providers (OpenAI primary, Grok/Google optional), responsive Material Design UI.

## Technical Context

**Language/Version**: JavaScript ES2022+ (Vanilla JS, no framework)  
**Primary Dependencies**: Vite (build), OpenAI SDK, Google AI SDK (US4), Vitest (testing)  
**Storage**: LocalStorage/IndexedDB for client-side persistence (no backend DB required)  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: PWA - Modern browsers (Chrome, Firefox, Safari, Edge), mobile responsive  
**Project Type**: Web application (frontend-only PWA with direct API calls)  
**Performance Goals**: <100ms UI response, <2s initial load, offline-capable for UI  
**Constraints**: Client-side only (API keys stored locally), <100KB bundle (gzipped)  
**Scale/Scope**: Single user per instance, ~5 screens, stateless backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First (KISS) | ✅ PASS | Single-page PWA, no backend server, vanilla JS |
| II. Minimal Dependencies | ✅ PASS | Only LLM SDKs. No framework |
| III. Modern JavaScript Style | ✅ PASS | ES modules, async/await, ES6 classes throughout |
| IV. C# Naming Conventions | ✅ PASS | PascalCase components/classes, camelCase methods |
| V. Robust Exception Handling | ✅ PASS | Custom error classes for API/validation errors |
| VI. Quality Logging | ✅ PASS | Configurable console logging with levels |

## Project Structure

### Documentation (this feature)

```text
specs/master/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
├── tasks.md             # Phase 2 output (/speckit.tasks command)
└── changes/             # Change requests
    └── CR001-conversational-coaching.md  # Conversational UX refactor
```

### Source Code (repository root)

```text
src/
├── components/          # UI components as ES6 classes (PascalCase)
│   ├── UnifiedView.js   # Main unified layout container (replaces tab-based navigation)
│   ├── PromptPanel.js   # Fixed prompt panel at top (extracted from PromptWorkspace)
│   ├── ConversationArea.js # Scrollable center - coaching chat + LLM responses
│   ├── InputPanel.js    # Fixed input panel at bottom with send + test buttons
│   ├── MarkdownField.js # Editable markdown field with preview toggle
│   ├── MaximizeToggle.js # Reusable maximize control for panels
│   ├── HistoryPanel.js  # Session history with search/filter (US3)
│   ├── SessionCard.js   # Individual session display (US3)
│   ├── SearchBar.js     # Search input with filters (US3)
│   ├── FileUpload.js    # File attachment handling (US5)
│   ├── SettingsDialog.js # API key configuration (uses <dialog>)
│   ├── TabBar.js        # DEPRECATED - minimal header with Settings icon only
│   ├── PromptWorkspace.js # DEPRECATED - split into PromptPanel + InputPanel
│   ├── CoachPanel.js    # DEPRECATED - functionality moved to ConversationArea
│   └── BaseComponent.js # Base class for all components
├── services/            # Business logic classes
│   ├── LlmService.js    # Multi-provider LLM abstraction
│   ├── adapters/        # LLM provider adapters
│   │   ├── OpenAiAdapter.js   # OpenAI API adapter (implemented)
│   │   ├── GoogleAdapter.js   # Google Gemini adapter (US4)
│   │   ├── AnthropicAdapter.js # Anthropic Claude adapter (US4)
│   │   └── XaiAdapter.js      # xAI Grok adapter (US4)
│   ├── CoachService.js  # Coaching logic and principle validation (US2)
│   ├── StorageService.js # LocalStorage/IndexedDB wrapper
│   └── LogService.js    # Configurable logging
├── models/              # Data structures and error classes
│   ├── Prompt.js        # Prompt entity
│   ├── LlmTestResult.js # Test result entity
│   ├── AppSettings.js   # Settings entity
│   ├── Principle.js     # Coaching principle entity (US2)
│   ├── CoachingSession.js # Coaching session state (US2)
│   └── errors/          # Custom error classes
├── state/               # Application state management
│   └── AppState.js      # EventTarget-based state container
├── utils/               # Pure utility functions
├── config/              # App configuration
│   └── principles.js    # AIM/MAP/OCEAN principle definitions (US2)
├── styles/              # CSS files
│   ├── variables.css    # CSS custom properties (colors, spacing)
│   ├── components.css   # Component-specific styles
│   └── main.css         # Main stylesheet (imports others)
├── App.js               # Root application class
└── main.js              # Entry point

index.html               # HTML shell with semantic structure (root level)
public/
├── manifest.json        # PWA manifest
└── icons/               # PWA icons

tests/
├── unit/                # Vitest unit tests
└── e2e/                 # Playwright end-to-end tests
```

**Structure Decision**: Vanilla JS PWA with ES6 classes. Components extend BaseComponent for consistent lifecycle. State managed via AppState (EventTarget) with `maximizedPanel` state for panel maximize feature. CSS uses custom properties for Material Design theming. Unified single-view layout replaces tab-based navigation (see 001-unified-layout feature).

## Implementation Notes

### Mobile Gesture Handling (US3)

For swipe-to-delete on session cards, use native touch events (`touchstart`, `touchmove`, `touchend`) with threshold detection. No external gesture library required—keeps bundle size minimal per constitution principle II.

**Implementation approach**:
- Track touch start X position
- On touchmove, calculate delta X
- If delta exceeds 100px threshold leftward, show delete confirmation
- CSS transform for visual swipe feedback
- Long-press: use `setTimeout` on touchstart (500ms), clear on touchend/touchmove

## Complexity Tracking

> No violations - all constitution principles satisfied.
