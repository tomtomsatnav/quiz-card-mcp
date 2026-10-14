# BRIEF: Quiz Card MCP App (v1)

## Goal
A user asks Claude to quiz them on any topic. Claude writes 5 multiple-choice
questions and passes them to the app, which renders an interactive quiz card in
the chat. The user picks an answer, sees whether they were right, moves to the
next question, and gets a final score.

## Host
- Target host: **Claude (claude.ai)** only, added as a custom connector.
- Server runs on Tom's VPS in **Docker**, behind **Caddy** for automatic HTTPS.
- Public URL: **https://quiz.duoswipe.lol**
- No login for v1. The app is open to anyone with the URL; it stores no personal data.

## Stack
- **TypeScript**, using the official MCP Apps SDK (`@modelcontextprotocol/ext-apps`).
- Before writing any code, **read the official MCP Apps documentation and example
  apps**. Do not rely on memory: the standard is newer than most training data.
  If the docs and your memory disagree, the docs win; log the disagreement in FRICTION.md.

## Out of scope (do not build)
- Typed answers / "challenge mode" (parked for v2)
- User accounts or login
- Saving progress or any database; each quiz is fresh
- ChatGPT or any host other than Claude
- Spaced repetition or review scheduling
- Visual polish beyond clean and readable
- Analytics or usage tracking

## Acceptance criteria
1. Asking Claude "quiz me on UK capitals" renders an interactive card in the chat
   showing one question and 4 options.
2. Clicking an option shows right or wrong and highlights the correct answer.
3. A Next button moves through all 5 questions, then shows a final score (e.g. 4/5).
4. The server runs in Docker on the VPS at https://quiz.duoswipe.lol and works as a
   Claude custom connector.

## Verification
The agent may only report "done" when it has shown evidence for each of these:
1. **Automated tests pass**: answer checking and scoring logic.
2. **Renders in a local inspector**: the card works in an MCP inspector tool
   without Claude.
3. **Live URL responds**: a request to https://quiz.duoswipe.lol returns a valid
   MCP response.
4. **Test script for Tom**: exact steps for the final check in Claude.ai, which
   only Tom can do (criteria 1–3 in the real host).

## Ways of working
- Ask Tom before running any command on the VPS or changing DNS.
- Work in small steps; after each one, say what changed and how it was checked.

## Friction log
Keep `FRICTION.md` updated throughout. Add an entry for every **failure, guess or
workaround**, including things that only worked after guessing. Use this format:

```
### YYYY-MM-DD: short title
- Who: agent | Tom
- Trying to: …
- What went wrong / was guessed: …
- Workaround: …
- Time lost: ~N min
- Category: docs | testing | deploying | host behaviour
```
