import { BareMuxConnection } from './vendor/channel/index.mjs?v=10';
import { assetBase, cattleBase, allowedTarget, packAddress, unpackAddress, hosts } from './settings.mjs?v=12';
import GameTransport from './session.mjs?v=12';
import './storage.js?v=10';

const nativeFetch = window.xyferBrowserFetch || window.fetch.bind(window);
const root = new URL('../', import.meta.url);
let startup;
let controller;
let phase = 'S1';
const events = new BroadcastChannel('xyfer-network');
events.onmessage = ({ data }) => showStatus(data.message);
// Upstream fetch is replaced below; keep this reference independent of it.

function showStatus(message) {
  const status = document.querySelector('#network-status');
  if (status) status.textContent = message;
}

async function start() {
  await globalThis.xyferPrepareStorage(root.pathname);
  if (!navigator.serviceWorker || !window.SharedWorker) {
    throw new Error('This browser needs service-worker and SharedWorker support. Open Xyfer in Chrome or Edge over HTTPS.');
  }
  showStatus('Preparing…');
  phase = 'S2';
  const connection = new BareMuxConnection(new URL('vendor/channel/worker.js?v=5', import.meta.url).href);
  await connection.setRemoteTransport(new GameTransport(), 'Xyfer session');
  phase = 'S3';
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('vendor/engine/index.js?v=10', import.meta.url).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the download engine'));
    document.head.append(script);
  });
  const { ScramjetController } = $scramjetLoadController();
  controller = new ScramjetController({
    prefix: new URL('runtime/data/', root).pathname,
    files: {
      all: new URL('vendor/engine/index.js?v=10', import.meta.url).href,
      wasm: new URL('vendor/engine/core.wasm', import.meta.url).href,
      sync: new URL('vendor/engine/sync.js', import.meta.url).href,
    },
    codec: { encode: packAddress, decode: unpackAddress },
    flags: { rewriterLogs: false, syncxhr: false, interceptDownloads: false },
  });
  phase = 'S4';
  const workerURL = new URL('worker.js?v=12', root).href;
  await navigator.serviceWorker.register(workerURL, { scope: root.pathname, updateViaCache: 'none' });
  await new Promise((resolve, reject) => {
    const check = () => {
      if (navigator.serviceWorker.controller?.scriptURL === workerURL) finish();
    };
    const finish = error => {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange', check);
      error ? reject(error) : resolve();
    };
    const timer = setTimeout(() => finish(new Error('Download worker did not activate. Reload the page.')), 20000);
    navigator.serviceWorker.addEventListener('controllerchange', check);
    check();
  });
  await controller.init();
  return controller;
}

export async function loadResource(input, init = {}) {
  if (!startup) startup = start().catch(error => {
    console.error('Xyfer startup', phase, error);
    startup = null;
    showStatus('Unable to load. Please retry. (' + phase + ')');
    throw error;
  });
  await startup;
  const original = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  let url = new URL(original, location.href);
  // Emscripten's split-file runtime asks for data chunks relative to this page.
  if (url.origin === location.origin && /^gd_web\.(data|wasm)(\.part\d+)?$/.test(url.pathname.split('/').pop())) {
    url = new URL(url.pathname.split('/').pop() + url.search, assetBase);
  }
  if (url.origin === location.origin && /^CrazyCattle3D\.(wasm|pck)$/.test(url.pathname.split('/').pop())) {
    url = new URL(url.pathname.split('/').pop() + url.search, cattleBase);
  }
  const proxyMarker = url.pathname.indexOf('/__proxy');
  if (proxyMarker >= 0 && url.searchParams.has('url')) url = new URL(url.searchParams.get('url'));
  if (hosts.includes(url.hostname)) url.protocol = 'https:';
  if (!allowedTarget(url.href)) throw new Error('Download destination is outside the game allowlist');
  const options = input instanceof Request ? {
    method: input.method, headers: input.headers,
    body: ['GET', 'HEAD'].includes(input.method) ? undefined : await input.clone().arrayBuffer(),
    ...init,
  } : init;
  const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(120000)]) : AbortSignal.timeout(120000);
  let response;
  try {
    response = await nativeFetch(controller.encodeUrl(url), { ...options, signal, referrer: '', referrerPolicy: 'no-referrer' });
    document.body.dataset.lastStatus = String(response.status);
  } catch (error) {
    document.body.dataset.lastFault = error.name + ': ' + error.message;
    console.error('Xyfer fetch', error);
    throw error;
  }
  if (response.status >= 500) { console.error('Xyfer request', decodeURIComponent(response.headers.get('X-Xyfer-Fault') || 'Unavailable')); throw new Error('Unable to load. Please retry.'); }
  return response;
}

export function resourceAddress(value) {
  let url = new URL(value, location.href);
  if (url.origin === location.origin && /^gd_web\.(data|wasm)(\.part\d+)?$/.test(url.pathname.split('/').pop())) {
    url = new URL(url.pathname.split('/').pop() + url.search, assetBase);
  }
  if (url.origin === location.origin && /^CrazyCattle3D\.(wasm|pck)$/.test(url.pathname.split('/').pop())) {
    url = new URL(url.pathname.split('/').pop() + url.search, cattleBase);
  }
  if (url.pathname.includes('/__proxy') && url.searchParams.has('url')) url = new URL(url.searchParams.get('url'));
  if (hosts.includes(url.hostname)) url.protocol = 'https:';
  if (!controller || !allowedTarget(url.href)) throw new Error('Game connection is not ready or destination is not allowed');
  return controller.encodeUrl(url);
}

// Loader scripts can call this immediately; transport starts only on a request.
window.xyferDownload = loadResource;
window.xyferAddress = resourceAddress;

const launchButton = document.getElementById('loadFly');
if (launchButton) launchButton.disabled = false;
if(window.parent!==window)window.parent.postMessage({type:'xyfer-player-ready'},location.origin);
