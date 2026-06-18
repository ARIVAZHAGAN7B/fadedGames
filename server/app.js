import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
