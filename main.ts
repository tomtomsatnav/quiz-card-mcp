/**
 * HTTP entry point: Streamable HTTP MCP at /mcp (stateless) and a /health check.
 */
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import cors from "cors";
import type { Request, Response } from "express";
import { createServer } from "./server.js";

const port = parseInt(process.env.PORT ?? "3001", 10);
// Interface to bind. 0.0.0.0 suits the container; the VPS systemd unit sets 127.0.0.1.
const host = process.env.HOST ?? "0.0.0.0";
// Host headers accepted (DNS rebinding protection). Caddy forwards the public hostname.
const allowedHosts = (process.env.ALLOWED_HOSTS ?? "localhost,127.0.0.1,quiz.duoswipe.lol")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const app = createMcpExpressApp({ host, allowedHosts });
app.use(cors());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.all("/mcp", async (req: Request, res: Response) => {
  const server = createServer();
  const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

const httpServer = app.listen(port, host, (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  console.log(`MCP server listening on http://${host}:${port}/mcp (allowed hosts: ${allowedHosts.join(", ")})`);
});

const shutdown = () => {
  httpServer.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
