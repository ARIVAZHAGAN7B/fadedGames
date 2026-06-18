const CACHE_IMAGE_URLS_MESSAGE = "CACHE_IMAGE_URLS";

export async function warmImageCache(urls) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  const imageUrls = [...new Set(urls.filter(Boolean))];

  if (imageUrls.length === 0) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active || navigator.serviceWorker.controller;

    if (worker) {
      worker.postMessage({
        type: CACHE_IMAGE_URLS_MESSAGE,
        urls: imageUrls
      });
    }
  } catch {
    // Cache warmup is optional; browser HTTP caching still applies.
  }
}
