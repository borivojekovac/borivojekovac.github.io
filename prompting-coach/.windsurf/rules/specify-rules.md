# prompting coach Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-02

## Active Technologies
- JavaScript ES2022+ (Vanilla JS, no framework) + Vite (build), OpenAI SDK, Google AI SDK, Lit (optional, ~5KB) (master)
- LocalStorage/IndexedDB for client-side persistence (no backend DB required) (master)
- JavaScript ES2022+ (Vanilla JS, no framework) + Vite (build), existing LLM SDKs (001-unified-layout)
- LocalStorage/IndexedDB (existing - no changes) (001-unified-layout)
- JavaScript ES2022+ (ES Modules) + Vite 5.x, OpenAI SDK; **NEW**: markdown parser (NEEDS CLARIFICATION: marked vs markdown-it) (002-markdown-support)
- N/A (in-memory state only) (002-markdown-support)

- JavaScript ES2022+ (Node.js LTS for any backend, modern browsers) + React (PWA), Material UI (minimal), OpenAI SDK (master)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

JavaScript ES2022+ (Node.js LTS for any backend, modern browsers): Follow standard conventions

## Recent Changes
- 002-markdown-support: Added JavaScript ES2022+ (ES Modules) + Vite 5.x, OpenAI SDK; **NEW**: markdown parser (NEEDS CLARIFICATION: marked vs markdown-it)
- 001-unified-layout: Added JavaScript ES2022+ (Vanilla JS, no framework) + Vite (build), existing LLM SDKs
- master: Added JavaScript ES2022+ (Vanilla JS, no framework) + Vite (build), OpenAI SDK, Google AI SDK, Lit (optional, ~5KB)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
