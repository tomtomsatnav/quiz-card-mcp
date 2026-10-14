# quiz-card-mcp

MCP App that renders a 5-question multiple-choice quiz card in Claude.

- **Read `BRIEF.md` first.** It defines scope, acceptance criteria and verification.
- **Log friction in `FRICTION.md`**: every failure, guess or workaround, in the format given in the brief.
- Ask Tom before running any command on the VPS or changing DNS.
- Commit after each step with a clear message.
- At the end of each step, append the step report (what changed, how it was checked, friction logged, what's next) to `docs/REPORTS.md` and commit it with the step.
- MCP Apps SDK is v2 (`@modelcontextprotocol/ext-apps` + split `@modelcontextprotocol/server|client|node|express` packages). Check the official docs, not memory: https://apps.extensions.modelcontextprotocol.io/api/

## Commands
- `npm run build`: type-check, bundle the card into `dist/mcp-app.html`, compile the server to `dist/server/`
- `npm start`: run the built server (HTTP, `/mcp` on `PORT`, default 3001)
- `npm run dev`: rebuild the card on change and run the server with tsx
- `npm test`: Vitest
