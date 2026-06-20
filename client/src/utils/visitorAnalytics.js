import { getServerUrl } from "../socket/client.js";

const VISITOR_ID_STORAGE_KEY = "faded-games-visitor-id";

let visitTrackedThisPage = false;

function createVisitorId() {
  const browserCrypto = typeof window !== "undefined" ? window.crypto : null;

  if (browserCrypto && typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function readVisitorId() {
  try {
    const savedId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);

    if (savedId) {
      return savedId;
    }

    const visitorId = createVisitorId();
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    return visitorId;
  } catch {
    return createVisitorId();
  }
}

function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

export function trackWebsiteVisit() {
  if (typeof window === "undefined" || typeof fetch !== "function") {
    return;
  }

  if (visitTrackedThisPage) {
    return;
  }

  visitTrackedThisPage = true;
  const visitorId = readVisitorId();
  const endpoint = new URL("/analytics/visit", getServerUrl());

  fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      visitorId,
      path: getCurrentPath()
    }),
    keepalive: true
  }).catch(() => {
    // Analytics should never interrupt gameplay.
  });
}

export async function fetchAnalyticsSummary() {
  const endpoint = new URL("/analytics/summary", getServerUrl());
  const response = await fetch(endpoint.toString());
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Unable to load analytics.");
  }

  return payload.analytics;
}

export async function fetchPlayerGameStatsSummary() {
  const endpoint = new URL("/analytics/game-stats", getServerUrl());
  const response = await fetch(endpoint.toString());
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Unable to load game analytics.");
  }

  return payload.stats;
}
