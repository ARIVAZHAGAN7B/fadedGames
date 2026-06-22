import cors from "cors";
import express from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHttpRateLimiter } from "./security/rateLimit.js";
import { getPlayerGameStatsSummary } from "./services/playerGameStats.js";
import { getAnalyticsSummary, recordVisit } from "./services/visitorAnalytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, "../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");
const EXAMPLE_ANALYTICS_ADMIN_TOKEN = "change-this-long-random-admin-token";
const MIN_PRODUCTION_ANALYTICS_ADMIN_TOKEN_LENGTH = 32;

function shouldServeClientRoute(request) {
  if (request.path.startsWith("/socket.io")) {
    return false;
  }

  if (path.extname(request.path)) {
    return false;
  }

  return Boolean(request.accepts("html"));
}

function secureCompare(firstValue, secondValue) {
  const firstHash = createHash("sha256").update(String(firstValue || "")).digest();
  const secondHash = createHash("sha256").update(String(secondValue || "")).digest();

  return firstHash.length === secondHash.length && timingSafeEqual(firstHash, secondHash);
}

function readBearerToken(request) {
  const header = String(request.headers.authorization || "");
  const [scheme, token] = header.split(/\s+/, 2);

  return scheme?.toLowerCase() === "bearer" ? token || "" : "";
}

function getAnalyticsAdminTokenConfigError(token) {
  if (!token) {
    return "Analytics admin token is not configured.";
  }

  if (token === EXAMPLE_ANALYTICS_ADMIN_TOKEN) {
    return "Analytics admin token must be changed from the example value.";
  }

  if (
    process.env.NODE_ENV === "production" &&
    token.length < MIN_PRODUCTION_ANALYTICS_ADMIN_TOKEN_LENGTH
  ) {
    return "Analytics admin token is too short for production.";
  }

  return "";
}

function requireAnalyticsAdmin(request, response, next) {
  const expectedToken = process.env.ANALYTICS_ADMIN_TOKEN || "";
  const configError = getAnalyticsAdminTokenConfigError(expectedToken);

  if (configError) {
    response.status(503).json({
      ok: false,
      error: configError
    });
    return;
  }

  if (!secureCompare(readBearerToken(request), expectedToken)) {
    response.status(401).json({
      ok: false,
      error: "Analytics authorization is required."
    });
    return;
  }

  next();
}

function securityHeaders(request, response, next) {
  const connectSources = [
    "'self'",
    "https:",
    "wss:",
    "http://localhost:*",
    "http://127.0.0.1:*",
    "ws://localhost:*",
    "ws://127.0.0.1:*"
  ].join(" ");
  const csp = [
    "default-src 'self'",
    `connect-src ${connectSources}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'"
  ].join("; ");

  response.setHeader("Content-Security-Policy", csp);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (request.secure || process.env.NODE_ENV === "production") {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

export function createApp({ allowOrigin } = {}) {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(cors({ origin: allowOrigin }));
  app.use(createHttpRateLimiter());
  app.use(express.json({ limit: "32kb" }));
  app.use((error, _request, response, next) => {
    if (error?.type === "entity.too.large") {
      response.status(413).json({
        ok: false,
        error: "Request body is too large."
      });
      return;
    }

    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({
        ok: false,
        error: "Invalid JSON request body."
      });
      return;
    }

    next(error);
  });

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

  app.get("/analytics/summary", requireAnalyticsAdmin, async (_request, response) => {
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

  app.get("/analytics/game-stats", requireAnalyticsAdmin, async (_request, response) => {
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
