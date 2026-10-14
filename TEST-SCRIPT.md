# Test script: quiz card in Claude.ai

Connector URL: `https://quiz.duoswipe.lol/mcp` (Settings > Connectors > Add custom connector). Step 7 result: criteria 1-4 passed on 2026-10-14.

## Setup
1. Add the connector and enable it for the chat.
2. Start a new chat each time you re-test.

## Tests
| # | Do this | Expect |
|---|---|---|
| 1 | Type "use the Quiz Card connector to quiz me on UK capitals" | A card with one question and 4 options. |
| 1b | Type "quiz me on UK capitals" (no tool named) | Known to fail: Claude's built-in quiz is used and no "Loaded quiz" step appears (FRICTION.md). |
| 2 | Click a wrong option | The option is marked wrong and the correct one is highlighted |
| 3 | Click a right option on another question | Marked right |
| 4 | Click Next through all 5 questions | A final score such as 3/5 |
| 5 | Try "test my knowledge of volcanoes" | The same card appears |

## Known behaviour (not failures)
- Claude may say "Good luck!" after the score: the card doesn't report back (v2).
- Expanding the tool call shows the correct answers (v1 limitation).

## If it fails
- Built-in widget appears: re-test with "use the show_quiz tool"; note it in FRICTION.md.
- No card, error text: check the connector is enabled, then `curl https://quiz.duoswipe.lol/health`.
