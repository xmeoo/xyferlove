import { loadResource } from '../../runtime/loader.mjs?v=18';

const base = 'https://raw.githubusercontent.com/genizy/web-port/a8bea5fd11f88e5a9192857f434e299c40efe7e6/fears-to-fathom/home-alone/Build/';
const totalBytes = 38 * 20866662 + 12582193;
const urls = [];
const play = document.querySelector('#play');
const loading = document.querySelector('#loading');
const label = document.querySelector('#label');
const progress = document.querySelector('#progress');
const network = document.querySelector('#network-status');
const tellParent = type => { if (parent !== window) parent.postMessage({ type }, location.origin); };
const remember = (bytes, type = 'application/octet-stream') => {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  urls.push(url);
  return url;
};
async function download(name) {
  const response = await loadResource(base + name);
  if (!response.ok) throw new Error(`Could not download ${name} (${response.status})`);
  return response.arrayBuffer();
}
async function launch() {
  play.disabled = true;
  progress.hidden = false;
  label.textContent = 'Connecting to game files…';
  tellParent('xyfer-game-loading');
  try {
    const loaderUrl = remember(await download('UnityLoader.js'), 'text/javascript');
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = loaderUrl;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not start the Unity loader'));
      document.head.append(script);
    });
    const parts = new Array(39);
    let next = 0, completed = 0, downloaded = 0;
    await Promise.all(Array.from({ length: 2 }, async () => {
      while (next < parts.length) {
        const index = next++;
        const bytes = await download(`FTFHAPort.data.unityweb.part${index + 1}`);
        parts[index] = bytes;
        completed++;
        downloaded += bytes.byteLength;
        progress.value = completed;
        label.textContent = `Downloading ${completed} / 39 parts · ${(downloaded / 1048576).toFixed(0)} / ${(totalBytes / 1048576).toFixed(0)} MB`;
      }
    }));
    const dataUrl = remember(new Blob(parts));
    parts.length = 0;
    window.dataUrll = dataUrl;
    label.textContent = 'Loading game engine…';
    const [code, framework] = await Promise.all([
      download('FTFHAPort.wasm.code.unityweb'),
      download('FTFHAPort.wasm.framework.unityweb'),
    ]);
    const config = {
      companyName: 'Rayll', productName: 'Fears To Fathom',
      dataUrl, wasmCodeUrl: remember(code), wasmFrameworkUrl: remember(framework),
      TOTAL_MEMORY: 536870912, graphicsAPI: ['WebGL 2.0', 'WebGL 1.0'],
      webglContextAttributes: { preserveDrawingBuffer: false },
      splashScreenStyle: 'Dark', backgroundColor: '#231F20',
    };
    const configUrl = remember(JSON.stringify(config), 'application/json');
    let ready = false;
    UnityLoader.instantiate('gameContainer', configUrl, {
      onProgress(_instance, value) { label.textContent = `Starting game · ${Math.round(value * 100)}%`; },
      Module: {
        resolveBuildUrl: value => value,
        onRuntimeInitialized() {
          if (ready) return;
          ready = true;
          loading.hidden = true;
          network.textContent = '';
          tellParent('xyfer-game-ready');
        },
      },
    });
  } catch (error) {
    console.error('Fears to Fathom startup', error);
    label.textContent = 'Unable to load the game. Please retry.';
    network.textContent = error.message;
    play.disabled = false;
    tellParent('xyfer-game-error');
  }
}
play.addEventListener('click', launch);
play.disabled = false;
tellParent('xyfer-player-ready');
addEventListener('pagehide', () => urls.forEach(URL.revokeObjectURL));
