import { io } from "socket.io-client";

function isLocalServerUrl(url) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function getServerUrl() {
  const configuredUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

  if (typeof window === "undefined") {
    return configuredUrl;
  }

  const pageHost = window.location.hostname;
  const isLocalPage = ["localhost", "127.0.0.1", "::1"].includes(pageHost);

  if (!isLocalPage && isLocalServerUrl(configuredUrl)) {
    return `${window.location.protocol}//${pageHost}:4000`;
  }

  return configuredUrl;
}

const serverUrl = getServerUrl();

export const socket = io(serverUrl, {
  autoConnect: true
});
