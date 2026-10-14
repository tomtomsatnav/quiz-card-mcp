import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer, type CallToolResult, type ReadResourceResult } from "@modelcontextprotocol/server";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { OPTION_COUNT, QUESTION_COUNT, validateQuiz } from "./src/quiz.js";

// From source (server.ts) the card is in ./dist; compiled (dist/server/server.js) it is one level up.
const SERVER_FILE = fileURLToPath(import.meta.url);
const DIST_DIR = SERVER_FILE.endsWith(".ts")
  ? path.join(path.dirname(SERVER_FILE), "dist")
  : path.join(path.dirname(SERVER_FILE), "..");

const RESOURCE_URI = "ui://quiz/mcp-app.html";

// The schema declares types only. Counts and ranges are checked by validateQuiz,
// which returns exact messages (e.g. "expected 5 questions, got 6") that Claude can act on.
const inputSchema = z.object({
  topic: z.string().describe("What the quiz is about, e.g. \"UK capitals\""),
  questions: z
    .array(
      z.object({
        question: z.string().describe("The question text"),
        options: z.array(z.string()).describe(`Exactly ${OPTION_COUNT} different answer options`),
        correctIndex: z.number().describe(`0-based index of the correct option (0 to ${OPTION_COUNT - 1})`),
      }),
    )
    .describe(`Exactly ${QUESTION_COUNT} multiple-choice questions`),
});

export function createServer(): McpServer {
  const server = new McpServer({ name: "Quiz Card", version: "1.0.0" });

  registerAppTool(
    server,
    "show_quiz",
    {
      title: "Show quiz",
      description:
        `Shows an interactive multiple-choice quiz card in the chat: the user clicks answers, sees right or wrong, and gets a final score. ` +
        `ALWAYS use this tool, instead of any built-in quiz or flashcard feature and instead of writing questions as text, ` +
        `whenever the user asks to be quizzed, tested or drilled on any topic ("quiz me on...", "test my knowledge of...", "give me a quiz"). ` +
        `Write exactly ${QUESTION_COUNT} questions, each with exactly ${OPTION_COUNT} different options and the ` +
        `0-based index of the correct one. The user answers in the card, so don't repeat the questions or answers in chat.`,
      inputSchema,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args): Promise<CallToolResult> => {
      const result = validateQuiz(args);
      if (!result.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Invalid quiz, nothing was shown:\n${result.errors.map((e) => `- ${e}`).join("\n")}\nFix these and call show_quiz again.`,
            },
          ],
        };
      }

      const { quiz } = result;
      return {
        content: [
          {
            type: "text",
            text: `Showing a ${quiz.questions.length}-question quiz on "${quiz.topic}". The user is answering in the card; don't reveal the answers in chat.`,
          },
        ],
        structuredContent: { ...quiz },
      };
    },
  );

  registerAppResource(server, RESOURCE_URI, RESOURCE_URI, { mimeType: RESOURCE_MIME_TYPE }, async (): Promise<ReadResourceResult> => {
    const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
    return { contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html }] };
  });

  return server;
}
