# Change Request: Conversational Coaching Experience

**CR ID**: CR001  
**Date**: 2025-12-02  
**Status**: Approved  
**Affects**: US2 (Coaching Session)  
**Priority**: High  

---

## 1. Problem Statement

The current coaching implementation exposes internal mechanics (AIM/MAP/DEBUG/OCEAN frameworks, progress bars, principle-by-principle evaluation buttons) to the user. This creates a **wizard-like experience** rather than a **natural coaching conversation**.

Users should feel like they're talking to an expert coach who guides them through prompt improvement using natural dialogue, not navigating a structured evaluation interface.

---

## 2. Desired User Experience

### 2.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Invisible Framework** | AIM/MAP/DEBUG/OCEAN principles are internal knowledge, never exposed to user |
| **Natural Conversation** | All interaction is free-form chat, no buttons for "Evaluate" or "Next Principle" |
| **Proactive Coach** | Coach initiates evaluation automatically, user doesn't trigger it |
| **Socratic Method** | Coach asks questions to guide improvement, doesn't give direct answers |
| **Batch Feedback** | Multiple passing principles summarized together naturally |
| **User Agency** | User can skip topics, ask about progress, or redirect conversation |

### 2.2 Conversation Flow Examples

#### Starting a Session
```
[User enters prompt in Workspace, clicks "Coach" button]

Coach: "I've taken a look at your prompt. I notice you're asking for help with 
[topic]. Let me share some observations...

Your prompt jumps straight into the task without establishing who should be 
responding. When you're asking an AI for help, it often helps to give it a 
role or perspective to work from.

What kind of expert or persona would be best suited to help you with this? 
For example, would you want advice from a senior developer, a technical writer, 
or perhaps a specific type of specialist?"
```

#### User Responds
```
User: "I think a senior software architect would be good"

Coach: "Great choice! A senior architect brings both technical depth and 
system-level thinking. How would you introduce that role at the start of 
your prompt? Think about what specific experience or perspective would be 
most relevant to your problem.

Once you've updated your prompt, let me know and I'll take another look."
```

#### Multiple Principles Pass
```
[User updates prompt, returns to coach]

User: "I've updated it, what do you think?"

Coach: "Much better! Your prompt now clearly establishes the expert role, 
and I can see you've also included good context about your project. The 
task you're asking for is specific and measurable.

There's one area we could strengthen: your prompt doesn't guide the AI on 
*how* to approach the problem. Would you like the response to follow a 
specific structure, or work through the problem step-by-step?"
```

#### User Skips a Topic
```
User: "I don't care about the structure, let's move on"

Coach: "No problem, we'll skip that. Looking at the rest of your prompt...

I notice you're asking for code but haven't specified any constraints like 
language version, coding style, or error handling preferences. What 
constraints are important for your use case?"
```

#### User Asks About Progress
```
User: "How's my prompt looking overall?"

Coach: "You've made solid progress! Your prompt now has a clear role, good 
context, and a specific task. The main areas we haven't addressed yet are 
around verification - asking the AI to check its work - and making sure 
your requirements are concrete rather than vague.

Would you like to work on those, or is the prompt good enough for your needs?"
```

---

## 3. Technical Requirements

### 3.1 State Management (Internal)

The following state must be tracked but **not displayed** to user:

```javascript
CoachingSession {
  // Existing fields remain
  
  // New: Evaluation state per principle (internal)
  evaluationState: Map<principleId, {
    status: 'pending' | 'passed' | 'failed' | 'skipped',
    feedback: string,
    evaluatedAt: Date,
    promptSnapshot: string
  }>,
  
  // New: Batch pending feedback (for natural grouping)
  pendingFeedback: {
    passed: PrincipleResult[],
    failed: PrincipleResult | null,  // Stop at first failure
  },
  
  // New: Conversation context
  conversationContext: {
    lastUserIntent: 'prompt_updated' | 'answer_question' | 'skip_principle' | 'ask_progress' | 'ask_clarification' | 'request_example' | 'end_session' | 'general_chat',
    awaitingPromptUpdate: boolean,
    currentFocus: principleId | null,
    lastCoachQuestion: string | null,  // For context when user answers
  },
  
  // New: Prompt change detection
  promptBaseline: {
    text: string,           // Prompt text when session started
    lastEvaluatedText: string,  // Prompt text at last evaluation
  }
}
```

### 3.2 CoachService Changes

| Method | Change |
|--------|--------|
| `startSession()` | Auto-evaluate from first principle, return natural language response |
| `evaluateCurrentPrinciple()` | Remove - replaced by automatic evaluation |
| `advanceToNextPrinciple()` | Remove - coach decides when to advance |
| `processUserMessage()` | **New** - Main entry point, handles all user input |
| `generateCoachResponse()` | **New** - Produces natural language from internal state |
| `evaluateFromCurrent()` | **New** - Batch evaluate from current principle until one fails |
| `detectPromptChange()` | **New** - Detect if prompt changed significantly since session start |

### 3.3 LLM Integration

The coach needs two types of LLM calls:

1. **Evaluation Call** (structured output)
   - Input: Prompt text + principle criteria
   - Output: Pass/fail + specific observations
   - Purpose: Determine principle satisfaction

2. **Response Generation Call** (natural language)
   - Input: Evaluation results + conversation history + user message
   - Output: Natural coaching response
   - Purpose: Communicate with user conversationally

### 3.4 UI Changes

| Component | Change |
|-----------|--------|
| `CoachPanel` | Remove: progress bar, principle display, evaluate button, advance button |
| `CoachPanel` | Keep: chat messages, chat input |
| `CoachPanel` | Add: "Session complete" summary at end |
| Welcome screen | Simplify to just "Start Coaching" explanation |

---

## 4. Conversation Intelligence

### 4.1 User Intent Detection

Coach must detect user intent from natural language:

| Intent | Example Phrases | Coach Action |
|--------|-----------------|--------------|
| `prompt_updated` | "I updated it", "check again", "how's this?" | Re-evaluate from current principle forward |
| `answer_question` | "A senior architect", "Yes", "I want it formal" | Process answer, guide next step |
| `skip_principle` | "skip this", "move on", "don't care about that" | Mark skipped, continue to next principle |
| `ask_progress` | "how am I doing?", "what's left?", "progress?" | Summarize without exposing framework |
| `ask_clarification` | "what do you mean?", "can you explain?" | Elaborate on last feedback |
| `request_example` | "show me an example", "like what?" | Provide example without giving direct answer |
| `end_session` | "that's enough", "I'm done", "finish" | Complete session with summary |
| `general_chat` | Anything else | Interpret in context, respond naturally |

### 4.2 Re-evaluation Behavior

When user indicates they've updated the prompt (`prompt_updated` intent):

1. **Fetch current prompt** from `AppState`
2. **Compare to baseline** - if >80% different (major rewrite), ask:
   > "It looks like you've written quite a different prompt. Would you like to continue improving the original, or start fresh with this new one?"
3. **If continuing**: Re-evaluate from **current principle forward** (not from beginning)
   - User may have fixed multiple issues at once
   - Previously passed principles stay passed
   - Previously skipped principles stay skipped
4. **Update `lastEvaluatedText`** to current prompt

### 4.3 Session Completion

Session completes when:
- **All principles pass/skipped**: Coach auto-completes with summary
- **User requests end**: Coach completes even if principles remain

**Auto-completion message** (when all principles done):
```
Coach: "Your prompt is looking solid! Here's what makes it strong:

• You've established a clear expert role
• The context and task are well-defined  
• You've included guidance on how to approach the problem
• Your requirements are specific and measurable

Feel free to test it out in the Workspace. If you'd like to refine 
anything further, just start a new coaching session."
```

**User-requested end** (principles remaining):
```
Coach: "No problem, let's wrap up here. Your prompt has improved - you've 
added a clear role and good context. If you want to strengthen it further 
later, we can work on making the requirements more concrete and adding 
verification steps. Good luck with your prompt!"
```

### 4.4 Response Guidelines

The coach should:
- ✅ Ask probing questions ("What kind of expert would help here?")
- ✅ Explain *why* something matters ("This helps the AI understand context...")
- ✅ Offer thinking frameworks ("Consider who would be reading this...")
- ✅ Acknowledge user choices ("Great, let's focus on...")
- ❌ Never mention AIM, MAP, DEBUG, OCEAN by name
- ❌ Never say "Principle 3 of 15" or show progress numbers
- ❌ Never give direct rewrites of the prompt
- ❌ Never use robotic language ("Evaluation complete", "Processing...")

---

## 5. Implementation Plan

### Phase 1: Core Refactor
- [ ] Update `CoachingSession` model with new state fields
- [ ] Refactor `CoachService` to conversation-based flow
- [ ] Create intent detection logic
- [ ] Create batch evaluation logic (evaluate until failure)
- [ ] Implement fixed-order principle progression with skip-on-pass

### Phase 2: LLM Integration
- [ ] Design evaluation prompt template (structured output)
- [ ] Design response generation prompt template (natural language)
- [ ] Implement two-stage LLM call flow
- [ ] Create Socratic response guidelines (questions, not answers)

### Phase 3: UI Simplification
- [ ] Strip `CoachPanel` to chat-only interface
- [ ] Remove progress bar, principle display, evaluate/advance buttons
- [ ] Add session resume prompt ("Resume or start fresh?")
- [ ] Add session completion summary view

### Phase 4: Session Persistence
- [ ] Ensure active session saves to IndexedDB on each state change
- [ ] Load active session on Coach tab mount
- [ ] Implement resume vs new session flow
- [ ] Handle edge cases (prompt changed while session inactive)

### Phase 5: Testing
- [ ] Unit tests for intent detection
- [ ] Unit tests for batch evaluation logic
- [ ] Integration tests for conversation flow
- [ ] E2E test for full coaching session
- [ ] E2E test for session resume after refresh

---

## 6. Acceptance Criteria

- [ ] User never sees AIM/MAP/DEBUG/OCEAN terminology
- [ ] User never sees progress bars or principle counts
- [ ] Coach automatically evaluates on session start
- [ ] Coach batches multiple passing principles into natural feedback
- [ ] Coach stops and engages user on first failing principle
- [ ] User can skip principles via natural language
- [ ] User can ask about progress and get natural summary
- [ ] Session auto-completes with summary when all principles pass/skipped
- [ ] User can end session early via natural language
- [ ] All interaction is free-form text input
- [ ] Active sessions persist across page refresh/close
- [ ] User can resume or start fresh when returning to unfinished session
- [ ] Principles evaluated in fixed AIM→MAP→DEBUG→OCEAN order
- [ ] Re-evaluation starts from current principle (not beginning)
- [ ] Major prompt changes (>80% different) trigger confirmation prompt
- [ ] Coach guides with questions, never gives direct prompt rewrites

---

## 7. Design Decisions

### 7.1 Prompt Sync
**Decision**: User reports via chat.

When coach asks user to update their prompt:
1. User switches to Workspace tab, edits prompt
2. User returns to Coach tab
3. User says "I updated it", "check now", "how's this?", etc.
4. Coach detects `prompt_updated` intent, fetches current prompt from `AppState`, re-evaluates

This keeps interaction natural and conversation-driven.

### 7.2 Session Persistence
**Decision**: Persist and allow resume.

- Active sessions are saved to IndexedDB
- If user has unfinished session when opening Coach tab, show: "You have an unfinished coaching session. Resume or start fresh?"
- Conversation history and evaluation state are preserved
- Supports accidental tab close, browser refresh, multi-day sessions

### 7.3 Principle Ordering
**Decision**: Fixed order (AIM→MAP→DEBUG→OCEAN) with skip on pass.

**Rationale**: 
- Users implicitly learn the framework structure through repeated use
- Fixed order creates muscle memory - users internalize the checklist
- Skipping passes keeps sessions efficient without extra triage calls
- **Ultimate goal**: User no longer needs the coach, having internalized the framework

**Order**:
1. Actor (AIM)
2. Input (AIM)  
3. Mission (AIM)
4. Memory (MAP)
5. Assets (MAP)
6. Actions (MAP)
7. Prompt Structure (MAP)
8. Chain of Thought (DEBUG)
9. Verifier (DEBUG)
10. Refinement (DEBUG)
11. Original (OCEAN)
12. Concrete (OCEAN)
13. Evident (OCEAN)
14. Assertive (OCEAN)
15. Narrative (OCEAN)

---

## 8. Session Lifecycle Behavior

### Page Refresh
On page refresh, the application **silently restores** the active session:
- Chat history is restored exactly as it was
- Prompt text is restored from AppState persistence
- No prompts or questions are shown to the user
- The user continues exactly where they left off

### Starting a New Session (Future - Burger Menu)
Starting a new session is an **intentional action** triggered from the burger menu (not implemented yet):
- Menu item: "New Session" or similar
- Behavior:
  1. If an active session exists, it is marked as `abandoned`
  2. Chat history is cleared
  3. Welcome message is shown
  4. User can start fresh with a new or modified prompt
- The `UnifiedView.startNewSession()` method is ready to be called from the menu

### Session Completion
A session completes naturally when all principles pass or are skipped:
- Coach provides a summary message
- Session status changes to `completed`
- User can continue chatting or start a new session via menu

---

## 9. References

- Original US2 specification in `spec.md`
- Current implementation in `src/services/CoachService.js`
- Principles defined in `src/config/principles.js`
