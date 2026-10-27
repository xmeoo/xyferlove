importScripts('../runtime/settings.js?v=17', '../runtime/storage.js?v=10', '../runtime/vendor/engine/index.js?v=10');
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const base = new URL('./', self.location.href);
const route = base.pathname + 'route/';
const ready = xyferPrepareStorage(base.pathname).then(() => new ScramjetServiceWorker());
let configured;
function engine() {
  if (!configured) configured = ready.then(async value => {
    value.config = undefined;
    await value.loadConfig();
    return value;
  }).catch(error => { configured = null; throw error; });
  return configured;
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== base.origin || !url.pathname.startsWith(route)) return;
  event.respondWith((async () => {
    try {
      const proxy = await engine();
      if (!proxy.route(event)) return new Response('Invalid browser address', { status: 400 });
      return await proxy.fetch(event);
    } catch (error) {
      console.error('Browser request failed', error);
      return new Response('Unable to load this page.', { status: 502 });
    }
  })());
});
