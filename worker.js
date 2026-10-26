importScripts('./runtime/settings.js', './runtime/storage.js', './runtime/vendor/engine/index.js?v=3');
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const engineReady = xyferStorageReady.then(() => new ScramjetServiceWorker());
const base = new URL('./', self.location.href);
const dataPath = base.pathname + 'runtime/data/';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data?.type === 'xyfer-check') event.ports[0]?.postMessage({ type: 'xyfer-ready' });
});
async function handle(event) {
  const url = new URL(event.request.url);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return fetch(event.request);
  if (url.pathname.startsWith(dataPath)) {
    try {
      const value = url.pathname.slice(dataPath.length).split('').reverse().join('').replaceAll('-', '+').replaceAll('_', '/');
      const target = atob(value + '='.repeat((4 - value.length % 4) % 4));
      if (!xyferSettings.allowedTarget(target)) return new Response('Unable to load.', { status: 403 });
      const engine = await engineReady;
      await engine.loadConfig();
      return await engine.fetch(event);
    } catch { return new Response('Unable to load. Please retry.', { status: 502 }); }
  }
  if (event.request.mode === 'navigate') {
    let file;
    if (url.pathname === base.pathname + 'index.svg' || url.pathname === base.pathname) file = new URL('index.html', base);
    else if (url.pathname.endsWith('/')) file = new URL(url.pathname + 'index.html', base);
    else if (/\.html?$/.test(url.pathname)) file = url;
    if (file) {
      const response = await fetch(file, { cache: 'no-store' });
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.set('Cache-Control', 'no-store');
      headers.delete('Content-Length');
      headers.delete('Content-Encoding');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
  }
  return fetch(event.request);
}
self.addEventListener('fetch', event => event.respondWith(handle(event)));
