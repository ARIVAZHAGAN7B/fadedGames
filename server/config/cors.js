const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://fadedgame.onrender.com"
];

export function getConfiguredOrigins(clientOrigin = process.env.CLIENT_ORIGIN) {
  return (clientOrigin || DEFAULT_CLIENT_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsOriginChecker({
  clientOrigin = process.env.CLIENT_ORIGIN,
  nodeEnv = process.env.NODE_ENV
} = {}) {
  const configuredOrigins = getConfiguredOrigins(clientOrigin);

  return function allowOrigin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin) || nodeEnv !== "production") {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS."));
  };
}
