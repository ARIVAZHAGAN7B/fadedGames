import cors from "cors";
import express from "express";

export function createApp({ allowOrigin } = {}) {
  const app = express();

  app.use(cors({ origin: allowOrigin }));
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "bingo-server" });
  });

  return app;
}
