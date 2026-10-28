/* Champions Tools service worker: makes the site work offline after the first
 * visit. Everything is cached at runtime (no build-time file list to keep in
 * sync), with a different strategy per kind of file. Bump VERSION to drop old
 * caches after a release that changes this file's behaviour. */
const VERSION = "champions-tools-v1";
const STATIC = `${VERSION}-static`;
const IMAGES = `${VERSION}-images`;
const PAGES = `${VERSION}-pages`;

self.addEventListener("install", (event) => {
  // Warm the cache with the app shell; failure (offline install) is fine.
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(self.registration.scope))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const hit = (await cache.match(request, { ignoreSearch: true })) || (await cache.match(self.registration.scope));
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const fresh = await fetch(request);
  if (fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || refresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES));
    return;
  }
  if (url.origin === self.location.origin) {
    if (url.pathname.includes("/_next/static/")) {
      event.respondWith(cacheFirst(request, STATIC)); // content-hashed: safe to keep forever
      return;
    }
    event.respondWith(staleWhileRevalidate(request, STATIC));
    return;
  }
  // Pokémon sprites etc. (cross-origin images): show the cached one instantly, refresh quietly.
  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request, IMAGES));
  }
});
