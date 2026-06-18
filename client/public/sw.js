const IMAGE_CACHE_NAME = "faded-games-images-v1";
const CACHE_PREFIX = "faded-games-";

async function fetchAndCacheImage(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

async function cacheImageUrls(urls) {
  const cache = await caches.open(IMAGE_CACHE_NAME);

  await Promise.all(
    urls.map(async (url) => {
      try {
        const request = new Request(url, { credentials: "same-origin" });
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response);
        }
      } catch {
        // Cache warmup is best effort; normal image loading still works.
      }
    })
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== IMAGE_CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
    ])
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_IMAGE_URLS" || !Array.isArray(event.data.urls)) {
    return;
  }

  event.waitUntil(cacheImageUrls(event.data.urls));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || request.destination !== "image") {
    return;
  }

  event.respondWith(
    caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        return await fetchAndCacheImage(request);
      } catch {
        return Response.error();
      }
    })
  );
});
