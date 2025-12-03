<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (Initial creation)

Added Principles:
- I. Simplicity First (KISS)
- II. Minimal Dependencies
- III. Modern JavaScript Style
- IV. C# Naming Conventions
- V. Robust Exception Handling
- VI. Quality Logging

Added Sections:
- Core Principles (6 principles)
- Technology Stack
- Code Style Guidelines
- Governance

Templates requiring updates:
- ✅ plan-template.md (no changes needed - Constitution Check section is generic)
- ✅ spec-template.md (no changes needed - technology agnostic)
- ✅ tasks-template.md (no changes needed - path conventions compatible)

Follow-up TODOs: None
-->

# Prompting Coach Constitution

## Core Principles

### I. Simplicity First (KISS)

Every solution MUST favor the simplest approach that satisfies requirements.

- **Minimal Code**: Write only the code necessary to solve the problem. No speculative features.
- **YAGNI**: You Aren't Gonna Need It. Do not implement functionality until it is actually required.
- **Single Responsibility**: Each module, class, and function MUST have one clear purpose.
- **Flat Over Nested**: Prefer flat structures over deeply nested hierarchies.
- **Early Returns**: Use guard clauses and early returns to reduce nesting and complexity.

**Rationale**: Simple code is easier to read, test, debug, and maintain. Complexity is the enemy of reliability.

### II. Minimal Dependencies

External dependencies MUST be justified and minimized.

- **Zero Dependencies by Default**: Start with no external packages. Add only when genuinely needed.
- **Justify Each Dependency**: Document why a dependency is required and what alternatives were considered.
- **Prefer Native APIs**: Use Node.js built-in modules (`fs/promises`, `path`, `url`, `crypto`) over npm packages when feasible.
- **Audit Regularly**: Review dependencies for security, maintenance status, and necessity.
- **No Transitive Bloat**: Avoid packages that pull in large dependency trees.

**Rationale**: Fewer dependencies mean smaller attack surface, faster installs, fewer breaking changes, and reduced maintenance burden.

### III. Modern JavaScript Style

Code MUST use modern JavaScript patterns that align with Java/C# paradigms.

- **Classes Over Functions**: Use ES6 classes for encapsulation. Avoid loose functions for stateful operations.
- **Async/Await Over Promises**: Use `async`/`await` syntax exclusively. No raw `.then()` chains or callbacks.
- **ES Modules Over CommonJS**: Use `import`/`export` syntax. Never use `require()`.
- **Strict Mode**: All modules MUST operate in strict mode (implicit with ES modules).
- **No `var`**: Use `const` by default, `let` only when reassignment is necessary.

**Rationale**: Modern syntax improves readability, aligns with enterprise language conventions, and enables better tooling support.

### IV. C# Naming Conventions

All identifiers MUST follow C#-style naming conventions.

- **PascalCase**: Classes, interfaces, enums, type aliases (e.g., `UserService`, `LogLevel`)
- **camelCase**: Methods, functions, variables, parameters (e.g., `getUserById`, `maxRetries`)
- **SCREAMING_SNAKE_CASE**: Constants and environment variables (e.g., `MAX_CONNECTIONS`, `API_KEY`)
- **Descriptive Names**: Names MUST be self-documenting. Avoid abbreviations except well-known ones (e.g., `id`, `url`, `api`).
- **Boolean Prefixes**: Boolean variables/methods SHOULD use `is`, `has`, `can`, `should` prefixes (e.g., `isValid`, `hasPermission`).

**Rationale**: Consistent naming reduces cognitive load and makes code immediately recognizable to developers from C#/Java backgrounds.

### V. Robust Exception Handling

All code MUST handle errors explicitly and gracefully.

- **No Silent Failures**: Every error MUST be either handled or propagated. Never swallow exceptions.
- **Custom Error Classes**: Define domain-specific error classes extending `Error` with meaningful names and properties.
- **Error Context**: Errors MUST include sufficient context (operation, input, state) for debugging.
- **Fail Fast**: Validate inputs early. Throw immediately on invalid state rather than proceeding.
- **Try-Catch Boundaries**: Place try-catch at appropriate boundaries (entry points, I/O operations). Avoid wrapping every line.
- **Async Error Handling**: Always use try-catch with async/await. Never leave promises unhandled.

**Rationale**: Proper error handling prevents silent data corruption, aids debugging, and ensures predictable system behavior.

### VI. Quality Logging

All significant operations MUST be logged with configurable verbosity.

- **Structured Logging**: Log entries MUST be structured (JSON format) for machine parsing.
- **Log Levels**: Support standard levels: `error`, `warn`, `info`, `debug`, `trace`.
- **Configurable Verbosity**: Log level MUST be configurable via environment variable (e.g., `LOG_LEVEL`).
- **Contextual Information**: Include timestamp, correlation ID, operation name, and relevant parameters.
- **No Sensitive Data**: Never log passwords, tokens, API keys, or PII.
- **Performance Logging**: Log operation durations for performance-critical paths.

**Rationale**: Quality logging enables observability, debugging in production, and performance analysis without code changes.

## Technology Stack

This project uses Node.js with the following constraints:

- **Runtime**: Node.js (LTS version)
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Package Manager**: npm (prefer npm over yarn/pnpm for simplicity)
- **No Transpilation**: Write code that runs directly on Node.js without Babel/TypeScript compilation (unless TypeScript is explicitly adopted)

## Code Style Guidelines

### File Organization

- One class per file (matching class name in PascalCase)
- Group related files in directories by feature/domain
- Keep files under 300 lines; split if larger

### Import Order

1. Node.js built-in modules
2. External dependencies (npm packages)
3. Internal modules (relative imports)
4. Blank line between each group

### Documentation

- JSDoc comments for all public classes and methods
- Inline comments only for non-obvious logic
- README.md for each significant module

## Governance

This constitution supersedes all other development practices for this project.

- **Compliance**: All code reviews MUST verify adherence to these principles.
- **Amendments**: Changes to this constitution require documented justification and version increment.
- **Exceptions**: Violations MUST be documented in code comments with rationale and tracked for future resolution.
- **Versioning**: Constitution follows semantic versioning (MAJOR.MINOR.PATCH).

**Version**: 1.0.0 | **Ratified**: 2025-12-02 | **Last Amended**: 2025-12-02
