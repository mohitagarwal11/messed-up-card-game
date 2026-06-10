# Agent Instructions

## Output

- No greetings, transitions, or summaries.
- No explanation of changes unless explicitly asked.
- No inline comments unless logic is non-obvious.
- Prose responses under 20 words.

## File Handling

- Never read a file unless directly required for the current edit.
- Never print unchanged file contents.
- Targeted edits only. No full file rewrites.
- Do not verify a write by immediately re-reading the file.

## Tool Use

- Batch terminal commands into one shell call where possible.
- Do not run exploratory commands (ls, find, cat) unless blocked.
- On error, fix directly. Do not ask permission to retry.
- Do not attempt the same fix more than twice — state the blocker instead.

## Scope

- Only modify files explicitly mentioned or directly required.
- Do not refactor or reformat anything outside task scope.
- Do not add dependencies unless asked.

## Assumptions

- Ambiguous intent → most conservative assumption, stated once.
- No mid-task clarifying questions.

## Code Standards

- Strict types, explicit error handling, modular structure.
- Match existing patterns in the codebase.
- Run compile/test command once before marking task complete if config exists.
