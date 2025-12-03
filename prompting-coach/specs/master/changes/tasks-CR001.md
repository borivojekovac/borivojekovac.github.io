# Tasks: CR001 - Conversational Coaching Experience

**Input**: [CR001-conversational-coaching.md](CR001-conversational-coaching.md)  
**Date**: 2025-12-02  

---

## Phase 1: Core Refactor

### Models

- [x] **CR1-001** Update `CoachingSession` model ✅
  - Add `evaluationState: Map<principleId, EvaluationState>`
  - Add `pendingFeedback: { passed: [], failed: null }`
  - Add `conversationContext: { lastUserIntent, awaitingPromptUpdate, currentFocus, lastCoachQuestion }`
  - Add `promptBaseline: { text, lastEvaluatedText }`
  - Add helper methods: `getNextPendingPrinciple()`, `markPrincipleStatus()`, `isComplete()`

- [x] **CR1-002** Create `EvaluationState` type/interface ✅
  - Properties: `status`, `feedback`, `evaluatedAt`, `promptSnapshot`
  - Status enum: `pending`, `passed`, `failed`, `skipped`

- [x] **CR1-003** Update `PrincipleResult` model ✅
  - Ensure compatible with batch feedback storage
  - Add `observations: string[]` for natural language feedback points

### Services

- [x] **CR1-004** Refactor `CoachService` - Remove old methods ✅
  - Remove `evaluateCurrentPrinciple()` 
  - Remove `advanceToNextPrinciple()`
  - Remove `sendCoachMessage()` (replaced by `processUserMessage`)
  - Keep `startSession()`, `completeSession()`, `abandonSession()`

- [x] **CR1-005** Implement `CoachService.processUserMessage(userMessage: string)` ✅
  - Main entry point for all user input
  - Detect intent from message
  - Route to appropriate handler
  - Return coach response

- [x] **CR1-006** Implement intent detection ✅
  - Create `detectIntent(message: string, context: ConversationContext): Intent`
  - Use keyword matching + context awareness
  - Intents: `prompt_updated`, `answer_question`, `skip_principle`, `ask_progress`, `ask_clarification`, `request_example`, `end_session`, `general_chat`

- [x] **CR1-007** Implement `CoachService.evaluateFromCurrent(promptText: string)` ✅
  - Start from `currentPrincipleIndex`
  - Evaluate each principle in order
  - Stop on first failure
  - Collect all passes into `pendingFeedback.passed`
  - Set failure in `pendingFeedback.failed`
  - Skip already-passed and already-skipped principles

- [x] **CR1-008** Implement `CoachService.detectPromptChange(currentPrompt: string)` ✅
  - Compare to `promptBaseline.text`
  - Calculate similarity (simple: Levenshtein ratio or word overlap)
  - Return `{ isSignificantChange: boolean, similarity: number }`
  - Threshold: >80% different = significant

- [x] **CR1-009** Update `CoachService.startSession()` ✅
  - Store initial prompt in `promptBaseline`
  - Auto-call `evaluateFromCurrent()`
  - Generate natural language opening response
  - Save session to storage

---

## Phase 2: LLM Integration

### Prompt Templates

- [x] **CR1-010** Create evaluation prompt template ✅ (in `#evaluatePrinciple`)
  - Input: prompt text, principle name, principle criteria
  - Request structured output: `{ passed: boolean, observations: string[], suggestions: string[] }`
  - Keep evaluation focused and fast

- [x] **CR1-011** Create response generation prompt template ✅ (in `#generateCoachResponse`)
  - Input: evaluation results, conversation history, user message, conversation context
  - System prompt with Socratic guidelines
  - Never mention framework names
  - Ask questions, don't give answers

- [x] **CR1-012** Create progress summary prompt template ✅ (in `#generateCoachResponse` with trigger='progress_check')
  - Input: evaluation state for all principles
  - Generate natural summary without exposing framework
  - Focus on what's strong and what could improve

- [x] **CR1-013** Create session completion prompt template ✅ (in `#generateCoachResponse` with trigger='auto_complete'/'user_end')
  - Input: all evaluation results, initial vs final prompt
  - Generate celebratory but informative summary
  - Highlight key improvements made

### LLM Call Flow

- [x] **CR1-014** Implement `evaluatePrinciple(promptText, principle)` ✅
  - Single principle evaluation
  - Parse structured response
  - Return `PrincipleResult`

- [x] **CR1-015** Implement `generateCoachResponse(context)` ✅
  - Takes evaluation results + conversation state
  - Calls LLM with response generation template
  - Returns natural language string

- [x] **CR1-016** Add response post-processing ✅ (via CONVERSATIONAL_SYSTEM_PROMPT rules)
  - Verify no framework names leaked
  - Verify no direct prompt rewrites given
  - Fallback to safe response if violated

---

## Phase 3: UI Simplification

### CoachPanel Refactor

- [x] **CR1-017** Remove wizard UI elements from `CoachPanel` ✅
  - Remove `#renderProgress()` method
  - Remove `#renderCurrentPrinciple()` method  
  - Remove `#renderFrameworkIndicators()` method
  - Remove evaluate button
  - Remove advance button

- [x] **CR1-018** Simplify `CoachPanel.template()` ✅
  - Keep: chat messages container, chat input
  - Add: session resume prompt (conditional)
  - Add: session complete summary (conditional)

- [x] **CR1-019** Update welcome screen ✅
  - Remove methodology overview (AIM/MAP/DEBUG/OCEAN badges)
  - Keep simple explanation: "Get expert guidance to improve your prompt"
  - Keep "Start Coaching" button

- [x] **CR1-020** Implement session resume UI ✅
  - Check for active session on mount
  - Show: "You have an unfinished session. Resume or start fresh?"
  - Two buttons: "Resume" / "Start Fresh"

- [x] **CR1-021** Implement session complete UI ✅
  - Show summary message in chat
  - Add "Start New Session" button
  - Clear session state

### Event Handling

- [x] **CR1-022** Update `CoachPanel` event handlers ✅
  - Remove: evaluate button handler, advance button handler
  - Update: chat input sends to `processUserMessage()`
  - Add: resume/fresh button handlers
  - Add: new session button handler

- [x] **CR1-023** Handle loading states ✅
  - Show typing indicator while LLM responds
  - Disable input during processing
  - Smooth scroll to new messages

---

## Phase 4: Session Persistence

- [ ] **CR1-024** Ensure session auto-saves
  - Save after each `processUserMessage()` call
  - Save after each evaluation state change
  - Debounce to avoid excessive writes

- [ ] **CR1-025** Load active session on mount
  - Check `StorageService.getActiveSessions()`
  - If active session exists for current prompt, offer resume
  - If active session for different prompt, offer choice

- [ ] **CR1-026** Handle prompt change during inactive session
  - When resuming, compare current prompt to `promptBaseline`
  - If >80% different, ask user what to do
  - Options: continue with original, start fresh with new

- [ ] **CR1-027** Clean up completed/abandoned sessions
  - Mark completed sessions with `status: 'completed'`
  - Don't offer to resume completed sessions
  - Keep in history for reference

---

## Phase 5: Testing

### Unit Tests

- [ ] **CR1-028** Test intent detection
  - Test each intent type with multiple phrases
  - Test context-aware detection (e.g., after coach asks question)
  - Test edge cases and ambiguous inputs

- [ ] **CR1-029** Test batch evaluation logic
  - Test evaluate-until-failure flow
  - Test skip handling
  - Test re-evaluation from current principle

- [ ] **CR1-030** Test prompt change detection
  - Test similarity calculation
  - Test threshold behavior
  - Test edge cases (empty prompt, identical prompt)

- [ ] **CR1-031** Test session state management
  - Test state transitions
  - Test persistence and recovery
  - Test completion conditions

### Integration Tests

- [ ] **CR1-032** Test full conversation flow
  - Start session → get feedback → respond → update prompt → re-evaluate
  - Mock LLM responses
  - Verify state changes

- [ ] **CR1-033** Test skip and progress flows
  - Skip principle → verify state
  - Ask progress → verify natural response
  - End early → verify summary

### E2E Tests

- [ ] **CR1-034** E2E: Complete coaching session
  - Start with prompt
  - Go through multiple principles
  - Complete session
  - Verify summary shown

- [ ] **CR1-035** E2E: Session resume after refresh
  - Start session
  - Refresh page
  - Verify resume prompt
  - Resume and continue

---

## Summary

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| Phase 1: Core Refactor | CR1-001 to CR1-009 | None |
| Phase 2: LLM Integration | CR1-010 to CR1-016 | Phase 1 |
| Phase 3: UI Simplification | CR1-017 to CR1-023 | Phase 1 |
| Phase 4: Session Persistence | CR1-024 to CR1-027 | Phase 1, 3 |
| Phase 5: Testing | CR1-028 to CR1-035 | Phase 1-4 |

**Total**: 35 tasks

**Estimated effort**: 
- Phase 1: ~4 hours
- Phase 2: ~3 hours  
- Phase 3: ~2 hours
- Phase 4: ~1 hour
- Phase 5: ~2 hours
- **Total**: ~12 hours
