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
