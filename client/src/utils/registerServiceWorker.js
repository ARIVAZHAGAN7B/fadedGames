export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const serviceWorkerUrl = `${normalizedBaseUrl}sw.js`;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(serviceWorkerUrl, { scope: normalizedBaseUrl })
      .catch(() => {
        // The app should keep working normally if the browser blocks service workers.
      });
  });
}
