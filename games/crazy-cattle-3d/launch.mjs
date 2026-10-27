import { loadResource } from '../../runtime/loader.mjs?v=13';

const nativeFetch = window.fetch.bind(window);
const progress = document.getElementById('progress');
const label = document.getElementById('progress-label');
const loading = document.getElementById('loading');
const canvas = document.getElementById('canvas');
const tellParent = type => { if (parent !== window) parent.postMessage({ type }, location.origin); };

window.fetch = async (input, init) => {
  const value = typeof input === 'string' ? input : input.url;
  if (/^(blob:|data:)/.test(value)) return nativeFetch(input, init);
  const response = await loadResource(input, init);
  if (/\.wasm(?:[?#]|$)/.test(value)) {
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/wasm');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
};

tellParent('xyfer-game-loading');
try {
  const missing = Engine.getMissingFeatures({ threads: false });
  if (missing.length) throw new Error('Required browser features unavailable');
  const engine = new Engine({
    args: [], canvas, canvasResizePolicy: 2,
    executable: 'CrazyCattle3D', focusCanvas: true,
    ensureCrossOriginIsolationHeaders: false, serviceWorker: '',
    fileSizes: { 'CrazyCattle3D.pck': 28642672, 'CrazyCattle3D.wasm': 43444261 },
    onPrintError: message => console.warn('Game engine', message),
  });
  await engine.startGame({ onProgress(current, total) {
    if (total > 0) { progress.max = total; progress.value = current; }
    label.textContent = current > 0 ? `${(current / 1000000).toFixed(1)} MB${total > 0 ? ' / ' + (total / 1000000).toFixed(1) + ' MB' : ''}` : 'Loading game…';
  } });
  loading.hidden = true;
  document.getElementById('network-status').textContent = '';
  canvas.focus();
  tellParent('xyfer-game-ready');
} catch (error) {
  console.error('Game startup', error);
  label.textContent = 'Unable to load. Please close and try again.';
  document.getElementById('network-status').textContent = 'Unable to load. Please retry.';
  tellParent('xyfer-game-error');
}
