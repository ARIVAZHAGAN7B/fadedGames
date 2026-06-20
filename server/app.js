import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPlayerGameStatsSummary } from "./services/playerGameStats.js";
import { getAnalyticsSummary, recordVisit } from "./services/visitorAnalytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, "../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

function shouldServeClientRoute(request) {
  if (request.path.startsWith("/socket.io")) {
    return false;
  }

  if (path.extname(request.path)) {
    return false;
  }

  return Boolean(request.accepts("html"));
}

export function createApp({ allowOrigin } = {}) {
  const app = express();

  app.use(cors({ origin: allowOrigin }));
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "bingo-server" });
  });

  app.post("/analytics/visit", async (request, response) => {
    try {
      const result = await recordVisit({
        visitorId: request.body?.visitorId,
        pathname: request.body?.path
      });

      response.status(201).json({ ok: true, ...result });
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 500;

      response.status(statusCode).json({
        ok: false,
        error:
          statusCode < 500 && error instanceof Error
            ? error.message
            : "Unable to record visit."
      });
    }
  });

  app.get("/analytics/summary", async (_request, response) => {
    try {
      response.json({
        ok: true,
        analytics: await getAnalyticsSummary()
      });
    } catch {
      response.status(500).json({
        ok: false,
        error: "Unable to load analytics."
      });
    }
  });

  app.get("/analytics/game-stats", async (_request, response) => {
    try {
      response.json({
        ok: true,
        stats: await getPlayerGameStatsSummary()
      });
    } catch {
      response.status(500).json({
        ok: false,
        error: "Unable to load game analytics."
      });
    }
  });

  if (existsSync(clientIndexPath)) {
    app.use(express.static(clientDistPath));

    app.get("*", (request, response, next) => {
      if (!shouldServeClientRoute(request)) {
        next();
        return;
      }

      response.sendFile(clientIndexPath);
    });
  }

  return app;
}
