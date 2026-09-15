/**
 * Unified service worker for GamesHub.
 *
 * IMPORTANT: only ONE service worker registration may exist for this origin.
 * A fetch from a page is always handled by the worker that *controls that
 * document* (the client), not by the worker whose scope happens to match the
 * request URL. Registering Scramjet at scope "/" and Ultraviolet at "/uv/"
 * therefore meant the Scramjet worker saw every `/uv/service/...` request,
 * failed its own route() check and passed it straight to the server, which
 * answered with the 404 page. That is why the Ultraviolet ("UV") proxy never
 * worked.
 *
 * This worker owns the single root registration and routes by prefix:
 *   /uv/service/...  -> Ultraviolet
 *   /scramjet/...    -> Scramjet
 */
importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts("/uv/uv.sw.js");
importScripts("/scram/scramjet.all.js");

const uv = new UVServiceWorker();
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Take over immediately: without claim() the page that registered this worker
// stays uncontrolled until a manual refresh, so the first proxied navigation
// would hit the server and 404.
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function proxyError(backend, err) {
  const msg = String((err && err.message) || err);
  const wispHint =
    /wisp|websocket|socket|connect/i.test(msg) &&
    "This usually means the selected transport needs a Wisp WebSocket, which the current host does not provide. Pick the \"Bare\" transport in Settings.";
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Proxy error</title>
<body style="font:14px/1.5 system-ui;background:#090810;color:#e6e6f0;padding:32px">
<h2 style="margin:0 0 8px">${backend} could not load this page</h2>
<pre style="white-space:pre-wrap;background:#13121f;padding:12px;border-radius:8px">${msg}</pre>
${wispHint ? `<p style="color:#ff8a9a">${wispHint}</p>` : ""}
</body>`,
    { status: 502, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

async function handleRequest(event) {
  // Ultraviolet (/uv/service/...)
  if (uv.route(event)) {
    try {
      return await uv.fetch(event);
    } catch (err) {
      console.error("[SW] ultraviolet fetch failed:", err);
      return proxyError("Ultraviolet", err);
    }
  }

  // Scramjet (/scramjet/...)
  try {
    await scramjet.loadConfig();
  } catch (err) {
    console.error("[SW] scramjet.loadConfig failed:", err);
    return fetch(event.request);
  }
  if (scramjet.route(event)) {
    try {
      return await scramjet.fetch(event);
    } catch (err) {
      console.error("[SW] scramjet fetch failed:", err);
      return proxyError("Scramjet", err);
    }
  }

  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});

self.addEventListener("error", (e) => {
  console.error("[SW] unhandled error:", e.message);
});
self.addEventListener("unhandledrejection", (e) => {
  console.error("[SW] unhandled rejection:", e.reason);
});
