# Research: Prompting Coach PWA

**Date**: 2025-12-02  
**Purpose**: Resolve technical decisions and document best practices for implementation

## 1. PWA Framework Selection

### Decision: Vite + Vanilla JS + Lit (lightweight web components)

### Rationale
- **Vite**: Fastest build tool, native ES modules, minimal config, excellent HMR
- **Vanilla JS**: Maximum control, no framework overhead, aligns with KISS principle
- **Lit**: Google's lightweight (~5KB) web components library - optional for complex components
- **vite-plugin-pwa**: Zero-config PWA generation, Workbox integration, automatic service worker

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| React | Too heavy (~40KB), framework lock-in, overkill for this app |
| Vue | Still framework overhead (~33KB), unnecessary abstraction |
| Svelte | Requires compilation step, less standard JS |
| Mustache/Handlebars | No reactivity, manual DOM updates tedious |
| Alpine.js | Good but adds non-standard attributes to HTML |

## 2. UI Styling Selection

### Decision: Custom CSS with CSS Variables + Material Design Lite (MDL) or custom Material styles

### Rationale
- **CSS Variables**: Native theming (light/dark), no build step
- **CSS Grid/Flexbox**: Native responsive layout, no framework needed
- **Material Design**: Achieved via CSS custom properties following Material spec
- **No UI framework**: Keeps bundle tiny, full control

### Approach
- Single `styles.css` file with CSS custom properties
- Material Design colors, shadows, typography via CSS variables
- Native `<dialog>`, `<details>` elements where possible
- Custom components as ES6 classes managing their own DOM

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Material UI (MUI) | Requires React, 100KB+ bundle |
| Tailwind CSS | Utility classes bloat HTML, build step required |
| Bootstrap | Heavy, dated design language |
| Shoelace | Web components but 80KB+, overkill |

## 3. LLM Provider Integration

### Decision: Unified LlmService class with provider adapters

### Rationale
- Single interface for all providers
- Easy to add new providers
- API keys stored in localStorage (user responsibility)
- Direct browser-to-API calls (no backend proxy)

### Supported Providers

| Provider | SDK/Method | Model Default | Notes |
|----------|------------|---------------|-------|
| OpenAI | `openai` npm package | gpt-4o-mini | Primary, best documented |
| Google (Gemini) | `@google/generative-ai` | gemini-1.5-flash | Good free tier |
| Anthropic (Claude) | REST API via fetch | claude-3-haiku | CORS may require proxy |
| xAI (Grok) | REST API via fetch | grok-beta | Limited availability |

### CORS Considerations
- OpenAI: Works from browser with API key
- Google: Works from browser with API key
- Anthropic: Requires `anthropic-dangerous-direct-browser-access` header
- xAI: Untested, may need proxy

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Backend proxy | Adds complexity, hosting cost, violates KISS |
| Single provider only | User requested multi-provider support |
| LangChain.js | Heavy dependency, overkill for simple chat |

## 4. Coaching Methodology Implementation

### Decision: Principle-based state machine with progressive validation

### Rationale
Based on `doc/knowledge.txt`, the coaching flow follows these frameworks:

#### AIM Framework (Week 1 - Basic Structure)
1. **A - Actor**: Does the prompt define who the AI should act as?
2. **I - Input**: Does the prompt provide necessary context/data?
3. **M - Mission**: Does the prompt clearly state the goal?

#### MAP Framework (Week 2 - Context Building)
1. **M - Memory**: Does the prompt reference prior context?
2. **A - Assets**: Are files/data attached when needed?
3. **A - Actions**: Are tool/action requirements specified?
4. **P - Prompt**: Is the instruction itself clear?

#### Debug Patterns (Week 3 - Refinement)
1. **Chain of Thought**: Ask AI to show reasoning
2. **Verifier Pattern**: Ask AI to clarify intent
3. **Refinement Pattern**: Ask AI to improve the question

#### OCEAN Framework (Week 4 - Quality)
1. **O - Original**: Non-obvious ideas?
2. **C - Concrete**: Names, examples, numbers?
3. **E - Evident**: Visible reasoning?
4. **A - Assertive**: Takes a stance?
5. **N - Narrative**: Story flow?

### Implementation Approach
```javascript
class CoachService {
  principles = [
    { id: 'aim-actor', name: 'Actor (A)', framework: 'AIM', ... },
    { id: 'aim-input', name: 'Input (I)', framework: 'AIM', ... },
    // ... all principles
  ];
  
  async validatePrinciple(prompt, principleId) {
    // Use LLM to assess if principle is satisfied
    // Return { satisfied: boolean, feedback: string, suggestions: string[] }
  }
}
```

## 5. File Upload Handling

### Decision: Client-side file reading with size limits

### Rationale
- Files read as text/base64 in browser
- Stored in session state (not persisted)
- Included in prompt context when testing
- Size limit: 100KB per file, 500KB total

### Supported File Types
- `.txt`, `.md` - Plain text
- `.json` - Structured data
- `.csv` - Tabular data
- `.pdf` - Via pdf.js (optional, adds dependency)

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Cloud storage | Adds complexity, privacy concerns |
| Unlimited size | Token limits, performance |
| Image files | Requires vision models, scope creep |

## 6. State Management

### Decision: Custom AppState class with event-based updates

### Rationale
- App state is simple (current prompt, session, settings)
- Custom class aligns with constitution (classes over functions)
- EventTarget for reactive updates without framework
- Aligns with minimal dependencies principle

### Implementation Pattern
```javascript
class AppState extends EventTarget {
  #state = {
    prompt: { text: '', files: [] },
    session: { currentPrinciple: 0, history: [], completedPrinciples: [] },
    settings: { provider: 'openai', apiKeys: {}, logLevel: 'info' },
    ui: { activeTab: 'editor', isLoading: false }
  };

  get(path) { /* return nested value */ }
  set(path, value) { /* update and dispatch 'change' event */ }
}

// Components subscribe:
appState.addEventListener('change', (e) => this.render());
```

## 7. Persistence Strategy

### Decision: localStorage for settings, IndexedDB for sessions, with automatic state hydration

### Rationale
- Settings (API keys, preferences): Small, localStorage sufficient
- Sessions (chat history, prompts): Larger, IndexedDB better suited
- No server-side storage needed
- **Seamless refresh recovery**: App state persisted on every change, restored on load

### Refresh Recovery Strategy

The app MUST recover seamlessly from page refresh with no data loss.

| State | Storage | Restore Behavior |
|-------|---------|------------------|
| Current prompt text | IndexedDB | Restore to editor immediately |
| Attached files | IndexedDB | Restore file list (content preserved) |
| Active coaching session | IndexedDB | Resume at exact principle/step |
| Chat history | IndexedDB | Full conversation restored |
| UI state (active tab, scroll) | sessionStorage | Restore view position |
| Settings & API keys | localStorage | Always available |
| LLM test results | IndexedDB | History preserved |

### Implementation Approach

```javascript
class AppState extends EventTarget {
  constructor(storageService) {
    // On construction, hydrate from storage
    this.#hydrateFromStorage();
    
    // Debounced persist on every change
    this.addEventListener('change', debounce(() => this.#persistToStorage(), 300));
    
    // Persist immediately before page unload
    window.addEventListener('beforeunload', () => this.#persistToStorage());
  }
  
  async #hydrateFromStorage() {
    const savedState = await this.storageService.getAppState();
    if (savedState) {
      this.#state = savedState;
      this.dispatchEvent(new CustomEvent('hydrated'));
    }
  }
}
```

### What Gets Persisted

- **Always persisted**: Prompt text, files, session progress, chat history, settings
- **Session-only**: Active tab, scroll positions, transient UI state
- **Never persisted**: Loading states, error toasts, API responses in flight

### Security Note
- API keys stored in localStorage (encrypted with user-provided passphrase optional)
- Warning displayed to users about local storage risks
- Keys never sent to any server except the respective LLM provider

## 8. Testing Strategy

### Decision: Vitest (unit) + Playwright (e2e)

### Rationale
- Vitest: Fast, Vite-native, Jest-compatible API
- Playwright: Cross-browser, reliable, good PWA support

### Test Coverage Targets
- Services: 80% unit test coverage
- Components: Integration tests for user flows
- E2E: Critical paths (prompt creation, coaching flow, LLM test)

## 9. Build & Deployment

### Decision: Vite build → Static hosting (Netlify/Vercel/GitHub Pages)

### Rationale
- No server needed (client-only PWA)
- Free tier sufficient for personal use
- Automatic HTTPS (required for PWA)

### Build Output
- `dist/` folder with static assets
- Service worker for offline capability
- Manifest for installability

## Summary of Key Decisions

| Area | Decision | Key Dependency |
|------|----------|----------------|
| Build | Vite | `vite` |
| UI Framework | Vanilla JS + Lit (optional) | `lit` (~5KB, optional) |
| UI Styling | Custom CSS + CSS Variables | (none) |
| PWA | vite-plugin-pwa | `vite-plugin-pwa` |
| LLM (Primary) | OpenAI | `openai` |
| LLM (Google) | Gemini | `@google/generative-ai` |
| State | Custom AppState class | (built-in) |
| Storage | localStorage + IndexedDB | (built-in) |
| Testing | Vitest + Playwright | `vitest`, `playwright` |

**Total Production Dependencies**: 3-4 (OpenAI SDK, Google AI SDK, optionally Lit)
