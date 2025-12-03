# Prompting Coach PWA

A Progressive Web App that coaches users on writing effective prompts for Large Language Models using the AIM/MAP/DEBUG/OCEAN methodology.

## Features

- **Prompt Workspace** - Write, edit, and test prompts against multiple LLM providers
- **Coaching Assistant** - Guided coaching through prompting best practices via natural conversation
- **Session History** - Track, search, star, and manage past coaching sessions
- **Multi-Provider Support** - OpenAI, Google Gemini, Anthropic Claude, xAI Grok
- **File Attachments** - Include text files as context for your prompts
- **Offline-Ready** - PWA with service worker for offline UI capability

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- API key from at least one supported LLM provider

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd prompting-coach

# Install dependencies
npm install

# Create environment file (optional)
cp .env.example .env
```

### Development

```bash
# Start development server
npm run dev

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build

# Preview production build
npm run preview
```

### Configuration

1. Open the app in your browser (default: http://localhost:5173)
2. Click the hamburger menu (☰) → Settings
3. Enter your API key for your preferred provider
4. Select the provider and model you want to use
5. Click Save

## Project Structure

```
prompting-coach/
├── src/
│   ├── components/     # UI components (ES6 classes)
│   ├── services/       # Business logic
│   │   └── adapters/   # LLM provider adapters
│   ├── models/         # Data structures
│   │   └── errors/     # Custom error classes
│   ├── state/          # Application state (EventTarget)
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── styles/         # CSS files
├── public/             # Static assets
├── tests/
│   ├── unit/           # Vitest unit tests
│   └── e2e/            # Playwright e2e tests
├── specs/              # Feature specifications
└── doc/                # Documentation
```

## Supported LLM Providers

| Provider | Models | API Key Format |
|----------|--------|----------------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-4 Turbo, GPT-3.5 Turbo | `sk-...` |
| Google | Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro | Google AI API key |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku | `sk-ant-...` |
| xAI | Grok Beta, Grok 2 | xAI API key |

## Technology Stack

- **Runtime**: Vanilla JavaScript (ES2022+, no framework)
- **Build**: Vite with PWA plugin
- **Testing**: Vitest (unit), Playwright (e2e)
- **Storage**: IndexedDB + localStorage (client-side only)
- **Styling**: CSS custom properties (Material Design 3)

## Architecture Principles

This project follows a strict constitution:

1. **Simplicity First (KISS)** - Minimal code, no speculative features
2. **Minimal Dependencies** - Only essential packages (LLM SDKs, build tools)
3. **Modern JavaScript** - ES6 classes, async/await, ES modules
4. **C# Naming Conventions** - PascalCase classes, camelCase methods
5. **Robust Error Handling** - Custom error classes, no silent failures
6. **Quality Logging** - Configurable log levels, structured output

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright e2e tests |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_LOG_LEVEL` | Logging verbosity (error/warn/info/debug/trace) | `info` |

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## Security Notes

- API keys are stored in browser localStorage
- No data is sent to any server except the configured LLM providers
- All processing happens client-side

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
