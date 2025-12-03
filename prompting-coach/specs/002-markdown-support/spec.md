# Feature Specification: Markdown Support for UI

**Feature Branch**: `002-markdown-support`  
**Created**: 2025-12-03  
**Status**: Draft  
**Input**: User description: "Provide markdown support to UI - prompt edit box and chat input box show plain text/markdown source while editing but render markdown when out of focus, chat window always shows rendered markdown"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Rendered Markdown in Chat (Priority: P1)

As a user, I want to see coach messages and my own messages displayed with proper markdown formatting (headings, bold, italic, lists, code blocks, links) so that the conversation is visually structured and easier to read.

**Why this priority**: The chat window is the primary interaction area where users spend most of their time. Rendering markdown here provides immediate visual improvement and readability for all conversations without requiring any user action.

**Independent Test**: Can be fully tested by sending a message containing markdown syntax and verifying it renders correctly in the chat balloon. Delivers immediate value by making coach responses with code examples, lists, and formatting readable.

**Acceptance Scenarios**:

1. **Given** a chat message containing `**bold**` text, **When** the message is displayed in the conversation area, **Then** the text appears bold (not as literal asterisks)
2. **Given** a chat message containing a fenced code block, **When** the message is displayed, **Then** the code appears in a monospace font with distinct background (no syntax highlighting)
3. **Given** a chat message containing a numbered or bulleted list, **When** the message is displayed, **Then** the list renders with proper indentation and markers
4. **Given** a chat message containing `# Heading`, **When** the message is displayed, **Then** the heading renders with appropriate size and weight
5. **Given** a chat message containing `[link text](url)`, **When** the message is displayed, **Then** a clickable hyperlink appears that opens in a new browser tab
6. **Given** a chat message containing `![alt text](image-url)`, **When** the message is displayed, **Then** the image renders inline with alt text shown if image fails to load
7. **Given** a chat message containing a GFM table, **When** the message is displayed, **Then** the table renders with proper column alignment and borders
8. **Given** a chat message containing task list items (`- [ ]` and `- [x]`), **When** the message is displayed, **Then** unchecked and checked checkboxes render (display-only, not interactive)
9. **Given** a chat message with nested bullet lists (2-3 levels), **When** the message is displayed, **Then** each level renders with increased indentation and appropriate markers
10. **Given** a chat message with nested numbered lists, **When** the message is displayed, **Then** sub-items render with proper indentation and numbering
11. **Given** a chat message with mixed list types (bullets inside numbered or vice versa), **When** the message is displayed, **Then** the nesting renders correctly with appropriate markers at each level
12. **Given** a chat message with multiple heading levels (h1, h2, h3), **When** the message is displayed, **Then** each heading level has visually distinct size and weight
13. **Given** a chat message containing `---` or `***`, **When** the message is displayed, **Then** a horizontal rule/divider line renders
14. **Given** a chat message with nested blockquotes (`> > text`), **When** the message is displayed, **Then** each nesting level has increased indentation
15. **Given** a chat message containing `inline code`, **When** the message is displayed, **Then** the text renders in monospace with subtle background distinction
16. **Given** a chat message with combined emphasis (`***bold and italic***`), **When** the message is displayed, **Then** the text renders with both bold and italic styling
17. **Given** a chat message with escaped characters (`\*not bold\*`), **When** the message is displayed, **Then** the literal asterisks appear without formatting
18. **Given** a chat message containing a bare URL like `https://example.com`, **When** the message is displayed, **Then** the URL renders as a clickable link (auto-linking)
19. **Given** a chat message with single line breaks, **When** the message is displayed, **Then** single newlines are preserved as line breaks (GFM behavior)

---

### User Story 2 - Edit Prompt with Markdown Preview (Priority: P2)

As a user, I want to write prompts using markdown syntax in the prompt edit box, seeing the raw markdown while typing but a rendered preview when I click away, so I can compose structured prompts while verifying how they will look.

**Why this priority**: The prompt panel is where users craft their prompts. Supporting markdown here allows users to structure complex prompts with formatting, and the focus-based toggle provides a natural editing experience without extra UI controls.

**Independent Test**: Can be fully tested by typing markdown in the prompt textarea, clicking outside, and verifying the rendered view appears. Click back into the area to verify raw markdown returns for editing.

**Acceptance Scenarios**:

1. **Given** the prompt textarea is focused, **When** the user types `**bold**`, **Then** the literal text `**bold**` is visible
2. **Given** the prompt textarea contains markdown and is focused, **When** the user clicks outside the textarea, **Then** the content displays as rendered markdown
3. **Given** the prompt panel shows rendered markdown (unfocused), **When** the user clicks on the rendered content, **Then** the raw markdown source appears in an editable textarea
4. **Given** the user is editing raw markdown, **When** they press Tab or click outside, **Then** the transition to rendered view is smooth without jarring layout shifts
5. **Given** the prompt contains only plain text (no markdown), **When** unfocused, **Then** the text displays normally without any rendering artifacts

---

### User Story 3 - Edit Chat Input with Markdown Preview (Priority: P3)

As a user, I want to compose chat messages using markdown in the input box, seeing raw markdown while typing but a preview when unfocused, so I can format my questions and responses to the coach.

**Why this priority**: Enhances the chat input experience similarly to the prompt panel, but is lower priority because chat messages are typically shorter and less frequently need complex formatting compared to prompts.

**Independent Test**: Can be fully tested by typing markdown in the chat input, clicking outside, verifying rendered preview, then clicking back to continue editing.

**Acceptance Scenarios**:

1. **Given** the chat input textarea is focused, **When** the user types markdown syntax, **Then** the raw markdown is visible for editing
2. **Given** the chat input contains markdown and loses focus, **When** the user clicks elsewhere, **Then** the content displays as rendered markdown preview
3. **Given** the chat input shows rendered preview, **When** the user clicks on it, **Then** focus returns and raw markdown is editable
4. **Given** the user submits a message, **When** the message appears in the chat history, **Then** it displays as rendered markdown (consistent with User Story 1)

---

### Edge Cases

- **Empty content**: When textarea is empty and loses focus, display placeholder text (not rendered markdown)
- **Invalid markdown**: Malformed markdown syntax should render gracefully without errors, showing the raw text where parsing fails
- **Very long content**: Large markdown documents should render without significant delay or UI freezing
- **Nested formatting**: Complex nested markdown (e.g., bold inside list inside blockquote) should render correctly
- **HTML in markdown**: Any raw HTML tags in user input should be escaped/sanitized to prevent XSS
- **Cursor position**: When switching from rendered view back to edit mode, cursor should be placed at a reasonable position (start or end of content)
- **Rapid focus changes**: Quick focus/blur sequences should not cause visual glitches or race conditions
- **Copy/paste**: Users should be able to copy rendered text and paste raw markdown when editing

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render markdown syntax in chat messages (both user and coach messages) at all times
- **FR-002**: System MUST display raw markdown source in the prompt textarea when the textarea is focused
- **FR-003**: System MUST display rendered markdown in the prompt panel when the prompt textarea is not focused
- **FR-004**: System MUST display raw markdown source in the chat input textarea when the textarea is focused
- **FR-005**: System MUST display rendered markdown preview in the chat input area when the textarea is not focused
- **FR-006**: System MUST support standard markdown elements: headings (h1-h6), bold, italic, strikethrough, inline code, fenced code blocks, ordered lists, unordered lists, blockquotes, links, horizontal rules, images, tables, and task lists
- **FR-011**: System MUST support nested lists (bullets and numbered) up to 3 levels deep with proper indentation
- **FR-012**: System MUST support mixed list types (bullets inside numbered lists and vice versa)
- **FR-013**: System MUST render multi-level headings (h1-h6) with visually distinct hierarchy
- **FR-014**: System MUST support nested blockquotes with increasing indentation per level
- **FR-015**: System MUST support combined emphasis (bold+italic) and other emphasis combinations
- **FR-016**: System MUST respect escaped markdown characters (e.g., `\*` renders as literal asterisk)
- **FR-017**: System MUST auto-link bare URLs (e.g., `https://example.com` becomes clickable)
- **FR-018**: System MUST preserve single line breaks as `<br>` (GFM line break behavior)
- **FR-007**: System MUST sanitize rendered markdown to prevent XSS attacks from malicious input
- **FR-008**: System MUST preserve the original markdown source text for editing (not convert rendered HTML back to markdown)
- **FR-009**: System MUST transition smoothly between edit and preview modes without layout jumps
- **FR-010**: System MUST maintain text content integrity during focus/blur transitions (no data loss)

### Key Entities

- **MarkdownContent**: Represents text that may contain markdown syntax; has raw source and rendered HTML representations
- **EditableMarkdownField**: A UI component that toggles between raw editing (focused) and rendered preview (unfocused) states
- **ChatMessage**: Extended to include rendered markdown content for display in conversation area

## Clarifications

### Session 2025-12-03

- Q: What should happen when a user clicks a rendered hyperlink? → A: Open links in a new browser tab (`target="_blank"`)
- Q: Should code blocks have syntax highlighting? → A: Basic styling only (monospace font + distinct background, no language-aware coloring)
- Q: Extended markdown features to include? → A: Images, tables, task lists, nested lists, mixed list types, multi-level headings, nested blockquotes, combined emphasis, escaped characters, auto-linking, and GFM line breaks

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All supported markdown elements (headings, bold, italic, code, lists, links, blockquotes, images, tables, task lists, nested structures) render correctly in chat messages
- **SC-002**: Users can edit markdown in prompt and chat input fields and see rendered preview within 100ms of losing focus
- **SC-003**: Switching between edit and preview modes preserves 100% of the original markdown content
- **SC-004**: No XSS vulnerabilities exist when rendering user-provided markdown content
- **SC-005**: Markdown rendering does not introduce visible layout shifts greater than 5 pixels during focus transitions
- **SC-006**: Users can successfully compose and send markdown-formatted messages without training or documentation
