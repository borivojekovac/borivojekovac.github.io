# Implementation Plan: Markdown Support for UI

**Branch**: `002-markdown-support` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-markdown-support/spec.md`

## Summary

Add markdown rendering to the Prompting Coach UI. Chat messages (ConversationArea) always display rendered markdown. Prompt textarea (PromptPanel) and chat input (InputPanel) show raw markdown while focused, rendered preview when unfocused. Requires a markdown parsing library with GFM support and XSS sanitization.

## Technical Context

**Language/Version**: JavaScript ES2022+ (ES Modules)  
**Primary Dependencies**: Vite 5.x, OpenAI SDK; **NEW**: marked + DOMPurify (see research.md)  
**Storage**: N/A (in-memory state only)  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: Modern browsers (PWA)  
**Project Type**: Single-page web application (Vite + vanilla JS)  
**Performance Goals**: Markdown render <100ms per focus change (per SC-002)  
**Constraints**: No visible layout shift >5px during transitions (per SC-005); XSS-safe (per SC-004)  
**Scale/Scope**: Single-user local app; messages typically <10KB each

## Constitution Check

### Pre-Design Gate (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First (KISS) | ✅ PASS | Single markdown service, reusable component pattern |
| II. Minimal Dependencies | ⚠️ REVIEW | Adding 2 new dependencies - must justify |
| III. Modern JavaScript Style | ✅ PASS | ES modules, classes, async/await |
| IV. C# Naming Conventions | ✅ PASS | PascalCase classes, camelCase methods |
| V. Robust Exception Handling | ✅ PASS | Graceful fallback on parse errors |
| VI. Quality Logging | ✅ PASS | Log render times for performance monitoring |

**Dependency Justification (Principle II)**:
- **Why needed**: Implementing a full GFM-compliant markdown parser from scratch would violate Principle I (Simplicity). Native browser APIs do not provide markdown parsing.
- **Alternatives considered**: Raw regex replacement (insufficient for nested structures, tables, XSS risk)
- **Selection criteria**: Small bundle size, GFM support, built-in XSS sanitization, active maintenance
- **Selected**: marked (32KB) + DOMPurify (20KB) = ~52KB total, ~15KB gzipped

### Post-Design Gate (Phase 1) ✅

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Simplicity First (KISS) | ✅ PASS | Single MarkdownService class, one MarkdownField component reused in 2 places |
| II. Minimal Dependencies | ✅ PASS | 2 dependencies justified, smaller than alternatives |
| III. Modern JavaScript Style | ✅ PASS | ES modules, class-based service and component |
| IV. C# Naming Conventions | ✅ PASS | MarkdownService, MarkdownField, parse(), getValue() |
| V. Robust Exception Handling | ✅ PASS | try/catch in parse(), fallback to escaped HTML |
| VI. Quality Logging | ✅ PASS | parseWithTiming() method for performance monitoring |

**Design Compliance Notes**:
- No new patterns introduced beyond existing BaseComponent inheritance
- File structure follows existing conventions (services/, components/)
- All public methods documented with JSDoc per constitution

## Project Structure

### Documentation (this feature)

```text
specs/002-markdown-support/
├── plan.md              # This file
├── research.md          # Phase 0: Library comparison
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Developer guide
├── contracts/           # Phase 1: Component interfaces
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── BaseComponent.js          # Existing base class
│   ├── ConversationArea.js       # MODIFY: Use MarkdownRenderer for messages
│   ├── PromptPanel.js            # MODIFY: Add focus/blur markdown toggle
│   ├── InputPanel.js             # MODIFY: Add focus/blur markdown toggle
│   └── MarkdownField.js          # NEW: Reusable edit/preview component
├── services/
│   └── MarkdownService.js        # NEW: Markdown parsing + sanitization
├── styles/
│   └── markdown.css              # NEW: Rendered markdown styling
└── models/
    └── ChatMessage.js            # MODIFY: Add renderedContent property

tests/
├── unit/
│   ├── services/
│   │   └── MarkdownService.test.js   # NEW: Parser unit tests
│   └── components/
│       └── MarkdownField.test.js     # NEW: Component unit tests
└── e2e/
    └── markdown.spec.js              # NEW: E2E rendering tests
```

**Structure Decision**: Follows existing single-project structure. New files added to existing directories. MarkdownService centralizes parsing logic (Single Responsibility). MarkdownField provides reusable focus-toggle behavior for PromptPanel and InputPanel.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 2 npm dependencies (marked, DOMPurify) | GFM markdown parsing with XSS sanitization | Regex-based parsing cannot handle nested structures, tables, or provide reliable XSS protection |

## Phase Completion Status

| Phase | Status | Artifacts |
|-------|--------|-----------|
| Phase 0: Research | ✅ Complete | [research.md](./research.md) |
| Phase 1: Design | ✅ Complete | [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md) |
| Phase 2: Tasks | ✅ Complete | [tasks.md](./tasks.md) - 24 tasks across 6 phases |
| Phase 3: Implementation | ✅ Complete | All 24 tasks completed |
