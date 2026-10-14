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

## Step 6: VPS deploy (2026-10-14)

### What changed
- **Deployed without Docker.** The VPS has a system Caddy 2.6.2 on 80/443 for duoswipe.lol, no Docker, and ufw allows 443 only from Cloudflare (80 closed). So the step 5 compose stack isn't used there.
- `quiz` DNS switched to proxied (Cloudflare) by Tom.
- On the VPS: user `quizcard` (system, `nologin`), repo cloned over HTTPS to `/srv/quiz-card` at `721fbe8`, `npm ci` and `npm run build` as `quizcard`, and `/etc/systemd/system/quiz-card.service` (enabled, running). It sets `HOST=127.0.0.1`, `PORT=3001`, `ALLOWED_HOSTS=quiz.duoswipe.lol,localhost,127.0.0.1`, `Restart=on-failure`, `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`.
- `/etc/caddy/Caddyfile`: appended one `quiz.duoswipe.lol` block (origin cert from the wildcard, `reverse_proxy 127.0.0.1:3001`). Existing blocks, firewall and the other DNS records untouched. Backup: `/etc/caddy/Caddyfile.bak-20261014-145215`.
- Repo: `main.ts` gets a `HOST` env var (default `0.0.0.0`); README documents the live setup and update command.

### How it was checked
| Check | Result |
|---|---|
| `systemctl is-active quiz-card` | `active` |
| Listener | `127.0.0.1:3001` only |
| Local `/health` on the VPS | `{"status":"ok"}` |
| `caddy validate` before reload | Valid configuration |
| `systemctl reload caddy` (not restart) | `active` |
| `https://duoswipe.lol` straight after reload | `200` |
| `https://quiz.duoswipe.lol/health` (via Cloudflare) | `200`, `server: cloudflare` |
| MCP `initialize` through the public URL | serverInfo `Quiz Card` 1.0.0 |
| `tools/list` | `show_quiz`, `_meta.ui.resourceUri` `ui://quiz/mcp-app.html` |
| `tools/call show_quiz` (5 valid questions) | success text plus `structuredContent` |
| `resources/read` of the card | `text/html;profile=mcp-app` |
| Local tests before pushing | 15 passed |

Calls were made with curl from the Mac, so they went through the Cloudflare proxy with Streamable HTTP responses (SSE `event: message`) intact. I did not test long-running requests against Cloudflare's 100 s timeout (the tool returns immediately), and not from Anthropic's servers: that is step 7.

### Friction logged
- Step 5 plan didn't match the VPS (Docker absent, Cloudflare-only firewall, port 80 closed, shared Caddy). Logged under deploying.
- First live `show_quiz` call used `title` instead of `topic` (my mistake), and a `git log` run as the wrong user hit "dubious ownership".

### What's next
Step 7: add `https://quiz.duoswipe.lol/mcp` as a custom connector in Claude and run the quiz there. That's the first test from Anthropic's servers and in Claude's own host styling, which is where Bot Fight Mode or WAF rules could still interfere.

## Step 7: test in Claude.ai (2026-10-14)

### What changed
- Tom tested the live connector in Claude.ai: **criteria 1-4 all pass** (wrong-answer and final-score screenshots held by Tom).
- `show_quiz` description reworded to make Claude prefer it: ALWAYS use it instead of any built-in quiz/flashcard feature or text questions, with example phrasings. Schema and behaviour unchanged. Deployed to the VPS.
- Two host-behaviour friction entries logged: built-in quiz widget chosen unless the tool was named; card doesn't report the score back ("Good luck!").
- README: limitations and a v2 section (score reporting, not built). New `TEST-SCRIPT.md` with the exact checks for Claude.ai.

### How it was checked
| Check | Result |
|---|---|
| `npm test` | 15 passed |
| `npm run build` | OK |
| Claude.ai, criteria 1-4 | Pass (Tom) |
| VPS deploy (pull, `npm ci`, build, restart) | `quiz-card` active at `7f58795` |
| `tools/list` on `https://quiz.duoswipe.lol/mcp` | Serves the new description ("ALWAYS use this tool, instead of any built-in quiz…") |
| New description changes Claude's choice | **Not yet verified**: Tom must re-test "quiz me on UK capitals" without naming the tool (TEST-SCRIPT.md, test 1) |

### Friction logged
- Built-in quiz widget beat show_quiz (host behaviour).
- No score reporting back to Claude (host behaviour).
- My first deploy-and-report command was denied as a whole, so the report was missing until this follow-up. Not a product issue, noted here only.

### What's next
Tom re-tests unprompted use. If the built-in widget still wins, options are a stronger description or telling users to name the tool. Score reporting is v2.

### Step 7 addendum: re-test result (2026-10-14)
Tom re-tested "quiz me on UK capitals" without naming the tool after the new description was live. Claude still used its built-in quiz and showed no "Loaded quiz" step. **The description change did not fix preference.** Likely cause (unverified): the host picks its built-in feature before consulting connector tools. Logged in FRICTION.md. Working path in v1: name the connector/tool in the prompt. Needs a decision from Tom on next steps.
