import { BareMuxConnection } from '../runtime/vendor/channel/index.mjs?v=10';
import '../runtime/storage.js?v=10';
import BrowserTransport from './transport.mjs?v=15';

const page = document.querySelector('#page');
const start = document.querySelector('#start');
const address = document.querySelector('#address');
const status = document.querySelector('#status');
const back = document.querySelector('#back');
const forward = document.querySelector('#forward');
const history = [];
let position = -1;
let controllerPromise;
let loading = false;
function message(value) { status.textContent = value; status.hidden = !value; }
const networkEvents = new BroadcastChannel('xyfer-network');
networkEvents.onmessage = ({data}) => { if (loading && data?.message) message(data.message); };
function controls() { back.disabled = position < 1; forward.disabled = position >= history.length - 1; }
function target(value) {
  value = value.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return new URL(value).href;
  if (/^[\w.-]+\.[a-z]{2,}(?::\d+)?(?:\/|$)/i.test(value)) return new URL('https://' + value).href;
  return 'https://www.google.com/search?q=' + encodeURIComponent(value);
}
async function setup() {
  if (!controllerPromise) controllerPromise = (async () => {
    if (!navigator.serviceWorker || !window.SharedWorker) throw new Error('This browser needs HTTPS and service worker support.');
    await xyferPrepareStorage(new URL('./', location.href).pathname);
    const connection = new BareMuxConnection(new URL('./runtime/vendor/channel/worker.js?v=5', import.meta.url).href);
    await connection.setRemoteTransport(new BrowserTransport(), 'Xyfer browser');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('../runtime/vendor/engine/index.js?v=10', import.meta.url).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    const { ScramjetController } = $scramjetLoadController();
    const controller = new ScramjetController({
      prefix: new URL('route/', location.href).pathname,
      files: {
        all: new URL('../runtime/vendor/engine/index.js?v=10', import.meta.url).href,
        wasm: new URL('../runtime/vendor/engine/core.wasm', import.meta.url).href,
        sync: new URL('../runtime/vendor/engine/sync.js', import.meta.url).href,
      },
      flags: { rewriterLogs: false, syncxhr: false, interceptDownloads: false },
    });
    const worker = new URL('sw.js?v=8', location.href).href;
    const workerPath = new URL('sw.js', location.href).pathname;
    await navigator.serviceWorker.register(worker, { scope: new URL('./', location.href).pathname, updateViaCache: 'none' });
    await new Promise((resolve, reject) => {
      if (new URL(navigator.serviceWorker.controller?.scriptURL || location.href).pathname === workerPath) return resolve();
      const timer = setTimeout(() => reject(new Error('Browser worker did not activate. Reload Xyfer.')), 20000);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (new URL(navigator.serviceWorker.controller?.scriptURL || location.href).pathname === workerPath) { clearTimeout(timer); resolve(); }
      });
    });
    await controller.init();
    return controller;
  })().catch(error => { controllerPromise = null; throw error; });
  return controllerPromise;
}
async function show(url, record = true) {
  if (!url) { loading = false; page.hidden = true; page.removeAttribute('src'); start.hidden = false; address.value = ''; message(''); if (record) { history.splice(position + 1); history.push(null); position = history.length - 1; } controls(); return; }
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Enter a web address.');
    message('Connecting…');
    const controller = await setup();
    loading = true;
    page.src = controller.encodeUrl(parsed);
    page.hidden = false;
    start.hidden = true;
    address.value = parsed.href;
    if (record) { history.splice(position + 1); history.push(parsed.href); position = history.length - 1; }
    controls();
    message('Loading…');
  } catch (error) { loading = false; message(error.message || 'Unable to open this page.'); }
}
page.addEventListener('load', () => { loading = false; message(''); });
document.querySelector('#address-form').addEventListener('submit', event => { event.preventDefault(); try { show(target(address.value)); } catch { message('Enter a valid address.'); } });
document.querySelectorAll('[data-url]').forEach(button => button.onclick = () => show(button.dataset.url));
document.querySelector('#home').onclick = () => show(null);
back.onclick = () => { if (position > 0) show(history[--position], false); };
forward.onclick = () => { if (position < history.length - 1) show(history[++position], false); };
document.querySelector('#reload').onclick = () => { if (position >= 0) show(history[position], false); };
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === parent && event.data?.type === 'xyfer-open-url') show(event.data.url);
});
controls();
