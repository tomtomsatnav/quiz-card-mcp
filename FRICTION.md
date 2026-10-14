# Friction log

### 2026-10-14: SDK is v2 with split packages, not the single SDK I remembered
- Who: agent
- Trying to: pick dependencies before planning
- What went wrong / was guessed: from memory I expected `@modelcontextprotocol/sdk`. The current docs (ext-apps 2.0.3) use separate `@modelcontextprotocol/server`, `/client`, `/node` and `/express` packages at ^2.0.0, plus zod ^4. Docs win.
- Workaround: follow the official quickstart and the `basic-server-vanillajs` example's dependency list.
- Time lost: ~2 min
- Category: docs

### 2026-10-14: Official example build script needs Bun
- Who: agent
- Trying to: copy the example's build setup
- What went wrong / was guessed: the `basic-server-vanillajs` `build` script calls `bun build`, but the quickstart says Node 20+ and doesn't mention Bun. The API docs also moved from modelcontextprotocol.github.io to apps.extensions.modelcontextprotocol.io (301 redirect).
- Workaround: plan to use `tsc` + `tsx` instead of Bun (the quickstart's approach).
- Time lost: ~2 min
- Category: docs

### 2026-10-14: npm audit warnings on example dev dependencies
- Who: agent
- Trying to: install the dependencies the official example uses
- What went wrong / was guessed: vitest 3 pulled in a critical tinypool advisory; `vite-plugin-singlefile` (used by the official example) pulls in a `braces` advisory with no non-breaking fix.
- Workaround: upgraded to vitest 5 (supports vite 6). Kept vite-plugin-singlefile: it's build-time only and `npm audit --omit=dev` reports 0 vulnerabilities, so nothing vulnerable ships in the image.
- Time lost: ~3 min
- Category: docs

### 2026-10-14: Vitest fails to start because of the example's vite.config.ts
- Who: agent
- Trying to: run the first unit tests
- What went wrong / was guessed: Vitest loads `vite.config.ts`, which (copied from the official example) throws "INPUT environment variable is not set". The examples have no unit tests, so they never hit this.
- Workaround: added `vitest.config.ts`, which Vitest uses instead of `vite.config.ts`.
- Time lost: ~2 min
- Category: testing

### 2026-10-14: createMcpExpressApp host checks not covered in the quickstart
- Who: agent
- Trying to: run the server behind Caddy at quiz.duoswipe.lol
- What went wrong / was guessed: the quickstart binds `0.0.0.0` with no Host header checks. The v2 package's type docs (not the quickstart) describe an `allowedHosts` option for DNS rebinding protection. My first `/health` curl also raced the server starting up and failed to connect.
- Workaround: pass `allowedHosts` (env `ALLOWED_HOSTS`, default `localhost,127.0.0.1,quiz.duoswipe.lol`); confirmed an unknown Host gets 403. Re-ran the health check once the server was up.
- Time lost: ~3 min
- Category: docs

### 2026-10-14: basic-host's serve script needs Bun
- Who: agent
- Trying to: run basic-host for verification step 2
- What went wrong / was guessed: the README says `npm start`, but that runs `bun --watch serve.ts`, and Bun isn't installed. The quickstart only says Node 20+.
- Workaround: ran `npm run build` and then `npx tsx serve.ts` in `examples/basic-host`. Works the same.
- Time lost: ~2 min
- Category: testing

### 2026-10-14: Overlapping Playwright calls left the card on question 3
- Who: agent
- Trying to: screenshot the card and click the first answer
- What went wrong / was guessed: I sent screenshot, click and snapshot calls in parallel. The screenshots failed (Playwright can only write inside the repo, not the scratchpad), and the click reported "Ref not found", yet the card had moved on to question 3. I suspected a card bug.
- Workaround: re-ran from a fresh page with one scripted click at a time and checked the state after each. The card behaved correctly (including ignoring a second click), so the overlapping calls caused it, not the card. Saved screenshots under `.playwright-mcp/` (now in .gitignore) and copied them to `docs/verification/`.
- Time lost: ~8 min
- Category: testing

### 2026-10-14: Host success/danger backgrounds made text hard to read in dark mode
- Who: agent
- Trying to: check the card in basic-host's dark theme
- What went wrong / was guessed: I coloured answered options with the host's `--color-background-danger` and `--color-text-danger`. In basic-host's dark theme that gave light-red text on a mid-red background, which was hard to read. Claude's palette is unknown until step 7.
- Workaround: show right/wrong with a 2px coloured border and a coloured ✓/✗ label; option text keeps the normal text colour. Re-checked in both themes.
- Time lost: ~4 min
- Category: host behaviour

### 2026-10-14: Docker Desktop can't mount files from the scratchpad
- Who: agent
- Trying to: run the compose stack locally with a test Caddyfile (`tls internal`) kept out of the repo
- What went wrong / was guessed: mounting a Caddyfile from `/private/tmp/...` failed with "not a directory": Docker Desktop doesn't share that path with its VM. Separately, a zsh-quoting slip broke one curl line (`$CURL_EXTRA` not split).
- Workaround: put the test Caddyfile inline in the override file using Compose `configs: content:`, and replaced the ports with `!override` so the local test doesn't take 80/443.
- Time lost: ~4 min
- Category: deploying

### 2026-10-14: Agent can't SSH into the VPS
- Who: agent
- Trying to: investigate, read-only, what serves ports 80/443 on the VPS (step 6, part 1)
- What went wrong / was guessed: `ssh ubuntu@57.129.160.237` (user guessed from shell history) was rejected with `Permission denied (publickey,password)`. This Mac has no SSH keys and the agent has no identities, so Tom probably logs in by password, which a non-interactive session can't use.
- Workaround: none yet. Asked Tom to run a read-only script himself or add a key for this Mac.
- Time lost: ~5 min (blocked)
- Category: deploying

### 2026-10-14: VPS didn't match the step 5 deploy plan
- Who: agent
- Trying to: deploy with the step 5 Docker + Caddy compose stack (step 6)
- What went wrong / was guessed: the plan assumed a free host with Docker. The VPS has no Docker, and a system Caddy 2.6.2 already owns 80/443 for duoswipe.lol. ufw allows 443 only from Cloudflare and keeps 80 closed, so a grey-cloud `quiz` name could neither be reached nor get a Let's Encrypt certificate. The server also bound 0.0.0.0 with no way to change it.
- Workaround: put `quiz` behind Cloudflare (proxied), add a site block to the existing Caddy that reuses the wildcard origin certificate, and run the app as a systemd service under a dedicated user. Added a `HOST` env var to `main.ts` (default 0.0.0.0 for the container; 127.0.0.1 on the VPS). Dockerfile and compose stay for local runs.
- Time lost: ~25 min
- Category: deploying

### 2026-10-14: Wrong argument name in the first live show_quiz call; git ownership check
- Who: agent
- Trying to: run the final `show_quiz` check through https://quiz.duoswipe.lol/mcp (step 6)
- What went wrong / was guessed: I wrote the test call from memory with `title` instead of `topic`; the server correctly returned `isError` (`topic: expected string, received undefined`). Earlier in the same step, a `git log` run as `ubuntu` in the `quizcard`-owned clone failed with "dubious ownership" and made the whole SSH command exit 128, although the clone had worked.
- Workaround: read the field names from `tools/list` and re-ran with `topic`; ran git commands as `quizcard` (`sudo -u quizcard git -C ...`).
- Time lost: ~3 min
- Category: deploying
