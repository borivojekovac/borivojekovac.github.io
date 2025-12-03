# Quickstart: Unified Layout

**Feature**: 001-unified-layout  
**Date**: 2025-12-03

## Overview

This guide walks through the unified layout feature from a user's perspective.

## Prerequisites

- Prompting Coach app running (`npm run dev`)
- API key configured in Settings (for LLM testing)

## Flow 1: Basic Unified View

### Steps

1. **Open the app** - Navigate to localhost, see unified view with three panels: prompt (top), conversation (center), input (bottom)

2. **Write a prompt** - Click prompt panel, type your prompt, see character/word count update

3. **Start coaching** - Type message in input panel, click Send, see conversation flow

4. **Test the prompt** - Click Test Prompt button, see LLM response in conversation with distinct styling

### Expected Result

All interactions in single view, no tab switching, prompt always visible.

## Flow 2: Maximize Panel

### Steps

1. **Maximize prompt panel** - Click maximize icon, panel fills screen below app title
2. **Edit in focused mode** - Full screen space for editing
3. **Restore** - Click restore icon or press Escape key
4. **Maximize other panels** - Same behavior for conversation and input panels

### Expected Result

Any panel maximizes to full viewport, Escape restores, only one maximized at a time.

## Flow 3: Integrated LLM Testing

### Steps

1. Write prompt in prompt panel
2. Have coaching conversation
3. Click Test Prompt - response appears in conversation with distinct styling
4. Continue coaching - all messages in chronological order

### Expected Result

LLM responses interspersed with coaching messages, visually distinct.

## Flow 4: Navigation

- **Settings** - Click Settings icon, configure API keys
- **History** - Click History icon (future US3)

### Expected Result

Minimal icon navigation, no Workspace/Coach tabs.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Escape | Restore maximized panel |
| Ctrl+Enter | Send message |

## Layout Diagram

Normal view has three stacked panels:
- Top: Prompt Panel (fixed, editable textarea, maximize toggle)
- Center: Conversation Area (scrollable, messages, maximize toggle)  
- Bottom: Input Panel (fixed, textarea + buttons, maximize toggle)

Maximized view: Selected panel fills entire viewport below app title, other panels hidden.
