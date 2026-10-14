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

### Live deployment (no Docker)

The live VPS doesn't use the compose stack: a system Caddy already owns ports 80/443 for another site, and Docker isn't installed. Instead:
- `quiz-card.service` (systemd) runs `node dist/server/main.js` as the unprivileged `quizcard` user from `/srv/quiz-card`, with `HOST=127.0.0.1`, `PORT=3001` and `ALLOWED_HOSTS=quiz.duoswipe.lol,localhost,127.0.0.1`.
- The existing Caddy has an extra `quiz.duoswipe.lol` block that proxies to `127.0.0.1:3001` and reuses the Cloudflare Origin Certificate.
- The `quiz` DNS record is proxied through Cloudflare (the firewall only admits Cloudflare on 443).
- Update with: `sudo -u quizcard git -C /srv/quiz-card pull && (cd /srv/quiz-card && sudo -u quizcard env HOME=/srv/quiz-card npm ci && sudo -u quizcard env HOME=/srv/quiz-card npm run build) && sudo systemctl restart quiz-card`.

The Dockerfile and compose file stay for local runs and other hosts. `HOST` (default `0.0.0.0`) sets the bind address.

## Known limitations

- **Answers are visible in the tool call.** Claude sends the correct answers to the server along with the questions, so anyone who expands the tool call in Claude can see them. That's acceptable for v1.
- No login. Anyone with the URL can use the server, which stores no data.
- Claude only. Other MCP Apps hosts may work but aren't tested.
- **The card doesn't report the score back to Claude.** After the final score Claude knows nothing about the result and can reply as if the quiz were just starting ("Good luck!"). See FRICTION.md.
- **Host may prefer its own quiz feature.** Claude's built-in quiz widget can win over `show_quiz`; even with an "ALWAYS use this tool" description, an unprompted "quiz me on…" still got the built-in quiz and the connector was not consulted. Name the connector or tool in the prompt.

## v2 ideas

- **Report the score back to Claude** when the quiz ends (for example by updating the model context or sending a follow-up message from the card), so Claude can comment on the result and offer another round. Not built in v1.
- Typed answers / "challenge mode" (see `BRIEF.md`).
