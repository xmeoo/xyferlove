import { BareMuxConnection } from './runtime/vendor/channel/index.mjs?v=10';
import './runtime/storage.js?v=10';
import BrowserTransport from './browser/transport.mjs?v=21';

let controllerPromise;

async function controller() {
  if (!controllerPromise) controllerPromise = (async () => {
    if (!navigator.serviceWorker || !window.SharedWorker) throw new Error('This game needs HTTPS and service worker support.');
    const base = new URL('./', import.meta.url);
    await xyferPrepareStorage(base.pathname);
    const connection = new BareMuxConnection(new URL('./runtime/vendor/channel/worker.js?v=5', base).href);
    await connection.setRemoteTransport(new BrowserTransport(), 'Xyfer games');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('./runtime/vendor/engine/index.js?v=10', base).href;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unable to start the game engine.'));
      document.head.append(script);
    });
    const { ScramjetController } = $scramjetLoadController();
    const instance = new ScramjetController({
      prefix: new URL('route/', base).pathname,
      files: {
        all: new URL('./runtime/vendor/engine/index.js?v=10', base).href,
        wasm: new URL('./runtime/vendor/engine/core.wasm', base).href,
        sync: new URL('./runtime/vendor/engine/sync.js', base).href,
      },
      flags: { rewriterLogs: false, syncxhr: false, interceptDownloads: false },
    });
    await instance.init();
    return instance;
  })().catch(error => { controllerPromise = null; throw error; });
  return controllerPromise;
}

export async function openCatalogGame(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('This game source is unavailable.');
  return (await controller()).encodeUrl(parsed);
}
