import { loadResource } from '../../runtime/loader.mjs?v=13';
import { slopeBase } from '../../runtime/settings.mjs?v=13';

const loading = document.querySelector('#loading');
const progress = document.querySelector('#progress');
const label = document.querySelector('#label');
const networkStatus = document.querySelector('#network-status');
const objectURLs = [];
const tellParent = type => { if (parent !== window) parent.postMessage({ type }, location.origin); };
const files = [
  ['dataUrl', 'data/slope_data.unityweb'],
  ['wasmCodeUrl', 'data/slope_wasmcode.unityweb'],
  ['wasmFrameworkUrl', 'data/slope_wasmframework.unityweb'],
  ['asmMemoryUrl', 'data/slope_memory.unityweb'],
  ['asmFrameworkUrl', 'data/slope_framework.unityweb'],
];

tellParent('xyfer-game-loading');
try {
  const urls = {};
  progress.max = files.length;
  let next = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (next < files.length) {
      const [key, path] = files[next++];
      const response = await loadResource(new URL(path, slopeBase).href);
      if (!response.ok) throw new Error('Asset download failed');
      urls[key] = URL.createObjectURL(new Blob([await response.arrayBuffer()], { type: 'application/octet-stream' }));
      objectURLs.push(urls[key]);
      progress.value += 1;
      label.textContent = `Downloading ${progress.value} / ${files.length}`;
    }
  }));
  const config = {
    companyName: 'IDnet', productName: 'Slope Game',
    ...urls, asmCodeUrl: '', TOTAL_MEMORY: 268435456,
    graphicsAPI: ['WebGL 2.0', 'WebGL 1.0'],
    webglContextAttributes: { preserveDrawingBuffer: false },
    splashScreenStyle: 'Dark', backgroundColor: '#231F20',
  };
  const configURL = URL.createObjectURL(new Blob([JSON.stringify(config)], { type: 'application/json' }));
  objectURLs.push(configURL);
  let ready = false;
  UnityLoader.instantiate('gameContainer', configURL, {
    onProgress(_instance, value) { label.textContent = value < 1 ? `Starting ${Math.round(value * 100)}%` : 'Ready'; },
    Module: {
      resolveBuildUrl: value => value,
      onRuntimeInitialized() {
        if (ready) return; ready = true;
        loading.hidden = true; networkStatus.textContent = '';
        tellParent('xyfer-game-ready');
      },
    },
  });
} catch (error) {
  console.error('Slope startup', error);
  label.textContent = 'Unable to load. Please close and try again.';
  networkStatus.textContent = 'Unable to load. Please retry.';
  tellParent('xyfer-game-error');
}
addEventListener('pagehide', () => objectURLs.forEach(URL.revokeObjectURL));
