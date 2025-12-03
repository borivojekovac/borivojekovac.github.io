# Quickstart: Prompting Coach PWA

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- API key for at least one LLM provider (OpenAI recommended)

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd prompting-coach
npm install
```

### 2. Environment Configuration

Create a `.env` file (optional, for development defaults):

```env
VITE_LOG_LEVEL=debug
```

**Note**: API keys are NOT stored in environment variables. Users enter them in the app settings.

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## First Run

### 1. Configure API Key

1. Click the **Settings** icon (gear) in the top right
2. Select your preferred LLM provider (OpenAI recommended)
3. Enter your API key
4. Click **Validate** to test the connection
5. Click **Save**

### 2. Create Your First Prompt

1. In the **Prompt Editor** tab, type your initial prompt
2. Optionally attach files using the **Upload** button
3. Click **Test** to see how the LLM responds

### 3. Start Coaching Session

1. Click **Start Coaching** to begin guided improvement
2. The coach will evaluate your prompt against the first principle (AIM: Actor)
3. Follow the suggestions to improve your prompt
4. Click **Re-evaluate** after making changes
5. Once satisfied, click **Next Principle** to continue
6. Repeat until all principles are covered

## Project Structure

```
prompting-coach/
├── src/
│   ├── components/       # UI components (ES6 classes)
│   ├── services/         # Business logic classes
│   ├── models/           # Data structures
│   ├── state/            # AppState management
│   ├── config/           # Configuration
│   ├── styles/           # CSS files
│   └── utils/            # Utilities
├── public/               # Static assets
├── tests/                # Test files
├── specs/                # Design documents
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Run ESLint |

## Key Features

### Prompt Editor
- Write and edit prompts
- Attach files for context
- Test against selected LLM
- View response history

### Coach Panel
- Guided principle-by-principle improvement
- Interactive chat with AI coach
- Progress tracking
- Suggestions and examples

### Settings
- Multiple LLM provider support
- API key management
- Theme selection (light/dark/system)
- Log level configuration

## Supported LLM Providers

| Provider | Models | Notes |
|----------|--------|-------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo | Primary, recommended |
| Google | gemini-1.5-pro, gemini-1.5-flash | Good free tier |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku | May have CORS issues |
| xAI | grok-beta | Limited availability |

## Coaching Methodology

The app guides users through four frameworks:

1. **AIM** (Basic Structure)
   - **A**ctor: Define who the AI should act as
   - **I**nput: Provide necessary context
   - **M**ission: State the clear goal

2. **MAP** (Context Building)
   - **M**emory: Reference prior context
   - **A**ssets: Attach relevant files
   - **A**ctions: Specify tool requirements
   - **P**rompt: Clear instruction

3. **DEBUG** (Refinement)
   - Chain of Thought
   - Verifier Pattern
   - Refinement Pattern

4. **OCEAN** (Quality)
   - **O**riginal: Non-obvious ideas
   - **C**oncrete: Specific examples
   - **E**vident: Visible reasoning
   - **A**ssertive: Takes a stance
   - **N**arrative: Story flow

## Troubleshooting

### API Key Not Working
1. Verify the key is correct (no extra spaces)
2. Check the provider's dashboard for key status
3. Ensure you have API credits/quota

### CORS Errors
Some providers (Anthropic) may have CORS restrictions. Try:
1. Using a different provider
2. Using a browser extension to bypass CORS (development only)

### PWA Not Installing
1. Ensure you're using HTTPS (or localhost)
2. Check browser console for manifest errors
3. Try clearing browser cache

## Development Notes

### Adding a New LLM Provider

1. Create adapter class in `src/services/adapters/`
2. Extend `BaseLlmAdapter` class
3. Implement required methods: `sendMessage()`, `validateApiKey()`
4. Register in `LlmService.js` provider map
5. Add to SettingsDialog UI

### Modifying Coaching Principles

Edit `src/config/principles.js` to:
- Add new principles
- Modify evaluation questions
- Change principle order

## License

[Your License Here]
