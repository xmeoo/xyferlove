/* Scramjet 1.1.0 + BareMux 2.1.9 + Epoxy 2.1.28 (matching API generations). */
importScripts('./proxy/vendor/scramjet/scramjet.all.js');
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
const routePrefix = new URL('./proxy/route/', self.location.href).pathname;
const assetBase = 'https://cdn.jsdelivr.net/gh/AlexBoops/geometry-dash-webport@c6ac9417ff93ea957425b23ee87f1ed290663ebb/';
function allowedTarget(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (
      url.href.startsWith(assetBase) || url.hostname === 'www.boomlings.com' || url.hostname === 'boomlings.com'
    );
  } catch { return false; }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(routePrefix)) return;
  event.respondWith((async () => {
    let target;
    try { target = decodeURIComponent(url.pathname.slice(routePrefix.length) + url.search); }
    catch { return new Response('Invalid target', { status: 400 }); }
    if (!allowedTarget(target)) return new Response('Game destination not allowed', { status: 403 });
    await scramjet.loadConfig();
    return scramjet.fetch(event);
  })());
});
