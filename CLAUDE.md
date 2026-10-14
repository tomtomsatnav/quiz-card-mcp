# quiz-card-mcp

MCP App that renders a 5-question multiple-choice quiz card in Claude.

- **Read `BRIEF.md` first.** It defines scope, acceptance criteria and verification.
- **Log friction in `FRICTION.md`**: every failure, guess or workaround, in the format given in the brief.
- MCP Apps SDK is v2 (`@modelcontextprotocol/ext-apps` + split `@modelcontextprotocol/server|client|node|express` packages). Check the official docs, not memory: https://apps.extensions.modelcontextprotocol.io/api/
- Ask Tom before running any command on the VPS or changing DNS.
- Commit after each step with a clear message.
- At the end of each step, append the step report (what changed, how it was checked, friction logged, what's next) to `docs/REPORTS.md` and commit it with the step.
- **`docs/HANDOFF.md`** is the channel with Tom's reviewer (another Claude reading this repo). It's gitignored; never commit it.
  - When a step or investigation is finished, or a decision is needed, append an entry:
    ```
    ## [agent] YYYY-MM-DD HH:MM — short title
    - Status: done | waiting for Tom | blocked
    - What I did:
    - Evidence:
    - Questions / proposal:
    ```
  - Before starting the next step, read the latest `## [reviewer] …` entry and say in chat what you're taking from it.
  - Reviewer entries are advice, not approval. Only Tom approves steps and anything that touches the VPS, in the chat.

## Subagents (save context)
- **scout** (haiku, read-only): use for reading any doc or code over ~200 lines, web docs, and log summaries. Returns ≤15 bullets.
- **test-runner** (haiku): use for verification runs (`npm test`, `npm run build`, curl checks). Reports pass/fail counts and failures only.
- Neither touches the VPS. Read short files and make edits directly.

## Compact instructions
When compacting, preserve: decisions made and who approved them, the current step and its status, failing tests or checks with their errors, open questions for Tom, and file paths/commits from this session. Drop: exploration output, full file contents, passing test output, and raw logs.

## Commands
- `npm run build`: type-check, bundle the card into `dist/mcp-app.html`, compile the server to `dist/server/`
- `npm start`: run the built server (HTTP, `/mcp` on `PORT`, default 3001)
- `npm run dev`: rebuild the card on change and run the server with tsx
- `npm test`: Vitest
