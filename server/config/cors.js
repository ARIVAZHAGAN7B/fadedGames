const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://fadedgame.onrender.com"
];

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isLocalDevelopmentOrigin(origin) {
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();

    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname === "[::1]" ||
        hostname.endsWith(".local") ||
        isPrivateIpv4(hostname))
    );
  } catch {
    return false;
  }
}

export function getConfiguredOrigins(clientOrigin = process.env.CLIENT_ORIGIN) {
  return (clientOrigin || DEFAULT_CLIENT_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsOriginChecker({
  clientOrigin = process.env.CLIENT_ORIGIN,
  nodeEnv = process.env.NODE_ENV,
  allowDevOrigins = process.env.ALLOW_DEV_ORIGINS
} = {}) {
  const configuredOrigins = getConfiguredOrigins(clientOrigin);
  const localDevelopmentOriginsAllowed =
    allowDevOrigins === "true" ||
    (nodeEnv === "development" && allowDevOrigins !== "false");

  return function allowOrigin(origin, callback) {
    if (
      !origin ||
      configuredOrigins.includes(origin) ||
      (localDevelopmentOriginsAllowed && isLocalDevelopmentOrigin(origin))
    ) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS."));
  };
}
