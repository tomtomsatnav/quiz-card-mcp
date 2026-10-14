# Step reports

One entry per step, appended when the step is committed. Steps 1–4 were reported in chat before this file existed; see the git log for their commits.

## Step 5: Docker and Caddy (2026-10-14)

### What changed
- `Dockerfile`: two stages. The build stage runs `npm ci` and `npm run build`, then removes dev dependencies. The run stage is `node:22-alpine` with production `node_modules` and `dist/` only. It runs as the non-root `node` user, has a `HEALTHCHECK` on `/health`, and starts with `node dist/server/main.js`. Image size: 276 MB.
- `.dockerignore`: keeps `node_modules`, `dist`, `.git`, docs and screenshots out of the build context.
- `docker-compose.yml`:
  - `app` sets `ALLOWED_HOSTS=quiz.duoswipe.lol,localhost,127.0.0.1` and is only reachable inside the compose network.
  - `caddy` (`caddy:2-alpine`) publishes 80, 443 and 443/udp, waits until `app` is healthy, and keeps certificates in named volumes.
- `Caddyfile`: `quiz.duoswipe.lol { reverse_proxy app:3001 }`. Caddy gets the HTTPS certificate automatically.
- `README.md`: new deploy section. The connector URL is `https://quiz.duoswipe.lol/mcp`.
- `CLAUDE.md`: new rule to append step reports to this file.

### How it was checked
I ran the full compose stack locally with a test override kept out of the repo. The override gives Caddy `tls internal` (a self-signed certificate) and ports 8081/8443, so it doesn't need the real domain or ports 80/443. curl sent `quiz.duoswipe.lol` to 127.0.0.1, so requests went through Caddy over HTTPS with the real host name:

| Check | Result |
|---|---|
| `app` container health | `healthy` |
| `GET /health` through Caddy | `200` |
| MCP `initialize` | serverInfo `Quiz Card` 1.0.0 |
| `tools/list` | `show_quiz`, linked to `ui://quiz/mcp-app.html` |
| Valid `show_quiz` | success, "Showing a 5-question quiz on \"UK capitals\"…" |
| 6-question `show_quiz` | `isError: true`, `expected 5 questions, got 6` |
| `resources/read` of the card | `text/html;profile=mcp-app` |
| HTTP on port 80 | `308` redirect to HTTPS |
| Straight to app, `Host: quiz.duoswipe.lol` | `200` |
| Same, with `ALLOWED_HOSTS=example.com` | `403`, so the allowlist is what admits that host |
| Straight to app, `Host: evil.example` | `403` |

The local stack and its volumes were removed afterwards.

**Not yet verified:** that Caddy forwards `Host: quiz.duoswipe.lol` on the live VPS with a real certificate. That's planned for step 6.

### Friction logged
- Docker Desktop can't mount files from the scratchpad (`/private/tmp`). Fixed by putting the test Caddyfile inline with Compose `configs: content:`.
- A zsh quoting slip in one curl command.

### What's next
Step 6, the VPS deploy, needs Tom's go-ahead before any command runs on the VPS:
1. Confirm DNS for `quiz.duoswipe.lol` points at the VPS.
2. Check that ports 80 and 443 are open.
3. Install Docker if needed, clone the repo, and run `docker compose up -d --build`.
4. Verify that `https://quiz.duoswipe.lol/health` and `/mcp` respond, and that Caddy forwards the real Host header (no 403).
