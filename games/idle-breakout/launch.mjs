import { loadResource } from '../../runtime/loader.mjs?v=15';
import { idleBase } from '../../runtime/settings.mjs?v=15';

const label = document.querySelector('#label');
const progress = document.querySelector('#progress');
const files = await (await fetch('files.json')).json();
const resources = new Map();
const tellParent = type => parent.postMessage({ type }, location.origin);
const nativeFetch = window.fetch.bind(window);
const objectURLs = [];
let saveTimer;
function saveProgress() {
  // Use this pinned build's own serializer, including its offline timestamp.
  try { if (typeof window._J1 === 'function') window._J1(null, null); } catch {}
}
function resource(value) {
  if (/^(blob:|data:)/.test(String(value))) return value;
  const url = new URL(value, location.href);
  const path = url.pathname.slice(url.pathname.indexOf('/assets/') + 1);
  return resources.get(path) || resources.get(path.replace(/\.mp3$/, '.ogg')) || value;
}

tellParent('xyfer-game-loading');
try {
  // Fail visibly if the browser would silently discard the game's saves.
  const check = 'xyfer.idle-breakout.storage-check';
  localStorage.setItem(check, '1');
  if (localStorage.getItem(check) !== '1') throw new Error('Storage unavailable');
  localStorage.removeItem(check);
  let completed = 0;
  progress.max = files.length + 1;
  async function download(path) {
    const response = await loadResource(new URL(path, idleBase).href);
    if (!response.ok) throw new Error('Asset download failed');
    const type = path.endsWith('.png') ? 'image/png' : path.endsWith('.ogg') ? 'audio/ogg' : 'text/javascript';
    const blob = new Blob([await response.arrayBuffer()], { type });
    const url = URL.createObjectURL(blob);
    objectURLs.push(url);
    progress.value = ++completed;
    label.textContent = `Downloading ${completed} / ${files.length + 1}`;
    return url;
  }
  // Share the existing session while keeping the number of concurrent requests small.
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < files.length) {
      const path = files[next++];
      resources.set(path, await download(path));
    }
  }));
  const engineURL = await download('html5game/Coding_BreakOut1.js');
  // GameMaker uses images, media elements and XHR rather than window.fetch.
  for (const type of [HTMLImageElement, HTMLMediaElement]) {
    const descriptor = Object.getOwnPropertyDescriptor(type.prototype, 'src');
    Object.defineProperty(type.prototype, 'src', { ...descriptor, set(value) { descriptor.set.call(this, resource(value)); } });
  }
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) { return open.call(this, method, resource(url), ...args); };
  window.fetch = (value, init) => nativeFetch(resource(typeof value === 'string' ? value : value.url), init);
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = engineURL; script.onload = resolve; script.onerror = reject;
    document.head.append(script);
  });
  // Stable across release tags, without sharing save keys with unrelated CDN games.
  window._3C = name => 'xyfer.idle-breakout.v1.' + name;
  const canvas = document.querySelector('#canvas');
  function fitCanvas() {
    const width = Math.floor(Math.min(innerWidth, innerHeight * 4 / 3));
    const height = Math.floor(width * 3 / 4);
    canvas.width = width; canvas.height = height;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    canvas.style.left = Math.floor((innerWidth - width) / 2) + 'px';
    canvas.style.top = Math.floor((innerHeight - height) / 2) + 'px';
    canvas.style.transform = 'none';
  }
  fitCanvas(); addEventListener('resize', fitCanvas);
  window.GameMaker_Init();
  saveTimer = setInterval(saveProgress, 10000);
  addEventListener('visibilitychange', () => { if (document.hidden) saveProgress(); });
  document.querySelector('#loading').hidden = true;
  document.querySelector('#network-status').textContent = '';
  document.querySelector('#canvas').focus();
  tellParent('xyfer-game-ready');
} catch (error) {
  console.error('Idle Breakout startup', error);
  label.textContent = 'Unable to load. Please close and try again.';
  document.querySelector('#network-status').textContent = 'Allow browser storage to retain progress.';
  tellParent('xyfer-game-error');
}
addEventListener('pagehide', () => {
  saveProgress(); clearInterval(saveTimer);
  objectURLs.forEach(url => URL.revokeObjectURL(url));
});
