import { BareMuxConnection } from './vendor/baremux/index.mjs';
import { assetBase, allowedTarget } from './servers.mjs';
import GameTransport from './transport.mjs';

const nativeFetch = window.xyferBrowserFetch || window.fetch.bind(window);
const root = new URL('../', import.meta.url);
let startup;
let controller;
const events = new BroadcastChannel('xyfer-network');
events.onmessage = ({ data }) => showStatus(data.message);
// Upstream fetch is replaced below; keep this reference independent of it.

function showStatus(message) {
  const status = document.querySelector('#network-status');
  if (status) status.textContent = message;
}

async function start() {
  if (!navigator.serviceWorker || !window.SharedWorker) {
    throw new Error('This browser needs service-worker and SharedWorker support. Open Xyfer in Chrome or Edge over HTTPS.');
  }
  showStatus('Starting download connection…');
  const connection = new BareMuxConnection(new URL('vendor/baremux/worker.js', import.meta.url).href);
  await connection.setRemoteTransport(new GameTransport(), 'Xyfer Epoxy/Wisp');
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('vendor/scramjet/scramjet.all.js', import.meta.url).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the download engine'));
    document.head.append(script);
  });
  const { ScramjetController } = $scramjetLoadController();
  controller = new ScramjetController({
    prefix: new URL('proxy/route/', root).pathname,
    files: {
      all: new URL('vendor/scramjet/scramjet.all.js', import.meta.url).href,
      wasm: new URL('vendor/scramjet/scramjet.wasm.wasm', import.meta.url).href,
      sync: new URL('vendor/scramjet/scramjet.sync.js', import.meta.url).href,
    },
    flags: { rewriterLogs: false, syncxhr: false, interceptDownloads: false },
  });
  await controller.init();
  const registration = await navigator.serviceWorker.register(new URL('proxy-sw.js', root), { scope: root.pathname });
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller?.scriptURL !== registration.active?.scriptURL) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Download worker did not activate. Reload the page.')), 15000);
      navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
  }
  return controller;
}

export async function proxyFetch(input, init = {}) {
  if (!startup) startup = start().catch(error => { startup = null; showStatus(error.message); throw error; });
  await startup;
  const original = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  let url = new URL(original, location.href);
  // Emscripten's split-file runtime asks for data chunks relative to this page.
  if (url.origin === location.origin && /^gd_web\.(data|wasm)(\.part\d+)?$/.test(url.pathname.split('/').pop())) {
    url = new URL(url.pathname.split('/').pop() + url.search, assetBase);
  }
  const proxyMarker = url.pathname.indexOf('/__proxy');
  if (proxyMarker >= 0 && url.searchParams.has('url')) url = new URL(url.searchParams.get('url'));
  if (url.hostname === 'www.boomlings.com' || url.hostname === 'boomlings.com') url.protocol = 'https:';
  if (!allowedTarget(url.href)) throw new Error('Download destination is outside the game allowlist');
  const options = input instanceof Request ? {
    method: input.method, headers: input.headers,
    body: ['GET', 'HEAD'].includes(input.method) ? undefined : await input.clone().arrayBuffer(),
    ...init,
  } : init;
  const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(120000)]) : AbortSignal.timeout(120000);
  const response = await nativeFetch(controller.encodeUrl(url), { ...options, signal });
  if (response.status >= 500) throw new Error('Relay request failed (' + response.status + ')');
  return response;
}

export function proxyUrl(value) {
  let url = new URL(value, location.href);
  if (url.origin === location.origin && /^gd_web\.(data|wasm)(\.part\d+)?$/.test(url.pathname.split('/').pop())) {
    url = new URL(url.pathname.split('/').pop() + url.search, assetBase);
  }
  if (url.pathname.includes('/__proxy') && url.searchParams.has('url')) url = new URL(url.searchParams.get('url'));
  if (url.hostname === 'www.boomlings.com' || url.hostname === 'boomlings.com') url.protocol = 'https:';
  if (!controller || !allowedTarget(url.href)) throw new Error('Game connection is not ready or destination is not allowed');
  return controller.encodeUrl(url);
}

window.__gdScramjetFetch = proxyFetch;
window.__gdScramjetOff = false;
// Loader scripts can call this immediately; transport starts only on a request.
window.xyferDownload = proxyFetch;
window.xyferProxyUrl = proxyUrl;
