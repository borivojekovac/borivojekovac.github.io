# Implementation Plan: Unified Layout

**Branch**: `001-unified-layout` | **Date**: 2025-12-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-unified-layout/spec.md`

## Summary

Refactor the Prompting Coach UI from a tab-based layout (Workspace/Coach tabs) to a unified single-view layout. The new layout features a fixed prompt panel at top, scrollable conversation area in center (combining coaching chat and LLM test responses), and fixed input panel at bottom. Each panel has a maximize toggle for focused editing/viewing.

## Technical Context

**Language/Version**: JavaScript ES2022+ (Vanilla JS, no framework)  
**Primary Dependencies**: Vite (build), existing LLM SDKs  
**Storage**: LocalStorage/IndexedDB (existing - no changes)  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: PWA - Modern browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend-only PWA)  
**Performance Goals**: <100ms UI response, smooth scrolling at 60fps  
**Constraints**: <100KB bundle (gzipped), maintain existing functionality  
**Scale/Scope**: Single unified view replacing 2 tabs, 3 panels with maximize

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First (KISS) | ✅ PASS | Simplifies UI by removing tab switching; single view is simpler UX |
| II. Minimal Dependencies | ✅ PASS | No new dependencies; pure CSS/JS refactor |
| III. Modern JavaScript Style | ✅ PASS | ES6 classes, async/await, ES modules |
| IV. C# Naming Conventions | ✅ PASS | PascalCase components, camelCase methods |
| V. Robust Exception Handling | ✅ PASS | Existing error handling preserved |
| VI. Quality Logging | ✅ PASS | Existing LogService used for UI state changes |

## Project Structure

### Documentation (this feature)

```text
specs/001-unified-layout/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI component contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── BaseComponent.js      # Existing - base class
│   ├── UnifiedView.js        # NEW - main unified layout container
│   ├── PromptPanel.js        # NEW - extracted from PromptWorkspace
│   ├── ConversationArea.js   # NEW - merged chat + LLM responses
│   ├── InputPanel.js         # NEW - user input + action buttons
│   ├── MaximizeToggle.js     # NEW - reusable maximize control
│   ├── CoachPanel.js         # DEPRECATED - functionality moves to ConversationArea
│   ├── PromptWorkspace.js    # DEPRECATED - split into PromptPanel + InputPanel
│   ├── SettingsDialog.js     # Existing - unchanged
│   └── TabBar.js             # DEPRECATED - bottom nav removed; Settings moved to header icon
├── models/
│   └── ChatMessage.js          # MODIFIED - added messageType field for llm_response distinction
├── services/
│   └── [existing services unchanged]
├── state/
│   └── AppState.js           # MODIFIED - add maximizedPanel state
└── styles/
    ├── variables.css         # Existing
    ├── main.css              # MODIFIED - unified layout styles
    └── components.css        # MODIFIED - panel styles, maximize styles

tests/
├── unit/
│   └── components/
│       └── UnifiedView.test.js  # NEW
└── e2e/
    └── unified-layout.spec.js   # NEW
```

**Structure Decision**: Extend existing single-project PWA structure. Create new components for unified layout while deprecating (not deleting) old tab-based components. This allows gradual migration and rollback if needed.

## Complexity Tracking

> No violations - all constitution principles satisfied.
