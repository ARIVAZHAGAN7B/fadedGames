const MINUTE_MS = 60_000;

const HTTP_RATE_LIMITS = [
  {
    name: "analytics-visit",
    max: 30,
    windowMs: MINUTE_MS,
    matches: (request) => request.path === "/analytics/visit"
  },
  {
    name: "analytics-admin",
    max: 10,
    windowMs: MINUTE_MS,
    matches: (request) => request.path === "/analytics/summary"
  },
  {
    name: "default",
    max: 120,
    windowMs: MINUTE_MS,
    matches: () => true
  }
];

const SOCKET_RATE_LIMITS = {
  "list-active-rooms": { max: 60, windowMs: MINUTE_MS, scope: "ip" },
  "create-room": { max: 5, windowMs: MINUTE_MS, scope: "ip" },
  "join-room": { max: 20, windowMs: MINUTE_MS, scope: "ip" },
  "resume-session": { max: 20, windowMs: MINUTE_MS, scope: "ip" },
  "set-board": { max: 12, windowMs: MINUTE_MS, scope: "player" },
  "match-chat:send": { max: 20, windowMs: MINUTE_MS, scope: "player" },
  "analytics:read": { max: 10, windowMs: MINUTE_MS, scope: "ip" },
  "tag-input": { max: 40, windowMs: 1_000, scope: "player" },
  default: { max: 30, windowMs: MINUTE_MS, scope: "player" }
};

function nowMs() {
  return Date.now();
}

function getRequestIp(request) {
  return request.ip || request.socket?.remoteAddress || "unknown";
}

function getSocketIp(socket) {
  return socket.handshake?.address || socket.conn?.remoteAddress || "unknown";
}

function pruneExpiredBuckets(buckets, now) {
  if (buckets.size < 10_000) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function incrementBucket(buckets, key, limit, now = nowMs()) {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + limit.windowMs
    });
    pruneExpiredBuckets(buckets, now);
    return { allowed: true, retryAfterMs: 0 };
  }

  existing.count += 1;

  if (existing.count <= limit.max) {
    return { allowed: true, retryAfterMs: 0 };
  }

  return {
    allowed: false,
    retryAfterMs: Math.max(0, existing.resetAt - now)
  };
}

export function createHttpRateLimiter(limits = HTTP_RATE_LIMITS) {
  const buckets = new Map();

  return function rateLimitHttp(request, response, next) {
    const limit = limits.find((entry) => entry.matches(request)) || limits[limits.length - 1];
    const key = `${limit.name}:${getRequestIp(request)}`;
    const result = incrementBucket(buckets, key, limit);

    if (result.allowed) {
      next();
      return;
    }

    response.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
    response.status(429).json({
      ok: false,
      error: "Too many requests. Try again shortly."
    });
  };
}

export function createSocketRateLimiter(limits = SOCKET_RATE_LIMITS) {
  const buckets = new Map();

  return function rateLimitSocket(socket, context) {
    socket.use((packet, next) => {
      const eventName = String(packet?.[0] || "");
      const limit = limits[eventName] || limits.default;
      const callback = packet?.[packet.length - 1];
      const identity =
        limit.scope === "ip"
          ? getSocketIp(socket)
          : socket.data?.playerId || socket.id || getSocketIp(socket);
      const key = `${eventName || "unknown"}:${identity}`;
      const result = incrementBucket(buckets, key, limit);

      if (result.allowed) {
        next();
        return;
      }

      const error = new Error("Too many requests. Try again shortly.");
      context.callbackError(socket, typeof callback === "function" ? callback : null, error);
    });
  };
}
