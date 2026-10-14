# Quiz Card MCP App

An [MCP App](https://apps.extensions.modelcontextprotocol.io/api/) that lets Claude quiz you on any topic. Ask Claude "quiz me on UK capitals" and it writes 5 multiple-choice questions. An interactive card in the chat then shows one question at a time with 4 options, marks your answer right or wrong, and gives you a final score.

Built for Claude (claude.ai) as a custom connector. See [`BRIEF.md`](BRIEF.md) for scope.

## How it works

- `server.ts` registers one tool, `show_quiz`, and the card resource, `ui://quiz/mcp-app.html`.
- Claude calls `show_quiz` with a topic and exactly 5 questions, each with 4 options and the index of the correct one. The server checks the quiz and returns it as `structuredContent`.
- If the quiz is invalid, the tool returns an error that lists exactly what's wrong, for example `expected 5 questions, got 6`, so Claude can fix it and try again.
- The card (`mcp-app.html` + `src/mcp-app.ts`) runs the quiz in the browser. Nothing is stored; each quiz is fresh.
- `src/quiz.ts` holds the rules (validation, answer checking, scoring), shared by the server and the card and covered by tests.

## Run it

Requires Node 20+.

```sh
npm install
npm run build   # type-check, bundle the card, compile the server
npm start       # http://localhost:3001/mcp, health check at /health
npm test
```

`npm run dev` rebuilds the card on change and runs the server with tsx.

Environment variables:
- `PORT`: default `3001`.
- `ALLOWED_HOSTS`: comma-separated Host headers the server accepts. Default `localhost,127.0.0.1,quiz.duoswipe.lol`.

## Deploy (Docker + Caddy)

`docker-compose.yml` runs two containers:
- `app`: the server, built from the `Dockerfile` (Node 22 Alpine, production dependencies only, runs as the non-root `node` user, with a health check on `/health`).
- `caddy`: serves `https://quiz.duoswipe.lol` with an automatic certificate (see `Caddyfile`) and proxies to `app:3001`. Ports 80 and 443 must be open, and DNS for `quiz.duoswipe.lol` must point at the server.

```sh
git clone https://github.com/tomtomsatnav/quiz-card-mcp.git && cd quiz-card-mcp
docker compose up -d --build
curl https://quiz.duoswipe.lol/health
```

The Claude custom connector URL is `https://quiz.duoswipe.lol/mcp`.

## Known limitations

- **Answers are visible in the tool call.** Claude sends the correct answers to the server along with the questions, so anyone who expands the tool call in Claude can see them. That's acceptable for v1.
- No login. Anyone with the URL can use the server, which stores no data.
- Claude only. Other MCP Apps hosts may work but aren't tested.
