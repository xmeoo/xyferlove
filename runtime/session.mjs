import StreamClient from './vendor/stream/index.mjs';
import { servers, assetBase, allowedTarget } from './settings.mjs?v=13';

const NativeSocket = globalThis.WebSocket;
const destinations = new Set(servers);
const sockets = new Set();
globalThis.WebSocket = class extends NativeSocket {
  constructor(address, protocols) {
    const tracked = destinations.has(String(address));
    if (tracked && [...sockets].some(socket => socket.readyState < NativeSocket.CLOSING)) throw new Error('Connection already active');
    super(address, protocols);
    if (tracked) {
      sockets.add(this);
      this.addEventListener('close', () => sockets.delete(this), { once: true });
    }
  }
};
async function closeSockets() {
  await Promise.all([...sockets].map(socket => new Promise(resolve => {
    if (socket.readyState === NativeSocket.CLOSED) return resolve();
    socket.addEventListener('close', resolve, { once: true });
    socket.close();
    setTimeout(resolve, 1000);
  })));
}

// The bundled WASM initializer is cached only after compilation finishes.
// Serialize the first initialization before creating competing relay clients.
let firstInitialization;
function initialize(transport) {
  if (!firstInitialization) return firstInitialization = transport.init();
  return firstInitialization.then(() => transport.init());
}

function deadline(promise, milliseconds, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label)), milliseconds); }),
  ]).finally(() => clearTimeout(timer));
}

// BareMux forwards requests to this page-owned transport, so concurrent game
// downloads share one verified Epoxy session and the page can report failures.
export default class GameTransport {
  ready = false;
  current = null;
  selecting = null;
  cursor = 0;
  channel = new BroadcastChannel('xyfer-network');

  async init() { this.ready = true; }
  async meta() { return {}; }

  report(message, endpoint = '') {
    this.channel.postMessage({ message, endpoint });
  }

  async select() {
    if (this.current) return this.current;
    if (this.selecting) return this.selecting;
    this.selecting = this.findRelay().finally(() => { this.selecting = null; });
    return this.selecting;
  }

  async findRelay() {
    // Check one connection at a time and reuse it for subsequent requests.
    for (let attempted = 0; attempted < servers.length; attempted++) {
      const endpoint = servers[this.cursor++ % servers.length];
      this.report('Connecting…');
      const transport = new StreamClient({ wisp: endpoint, wisp_v2: false });
      try {
          await deadline((async () => {
            await initialize(transport);
            const probe = await transport.request(new URL(assetBase + 'ref/logo.png'), 'GET', null, {}, undefined);
            if (probe.status !== 200) throw new Error('Relay asset probe failed');
            const bytes = new Uint8Array(await new Response(probe.body).arrayBuffer());
            if (bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) throw new Error('Invalid asset response');
          })(), 12000, 'Relay connection timed out');
        const selected = { transport, endpoint };
        this.current = selected;
        this.report('Ready', selected.endpoint);
        return selected;
      } catch {
        await closeSockets();
      }
    }
    this.report('Unable to load. Please retry.');
    throw new Error('None of the configured Wisp relays could fetch the game assets');
  }

  async request(remote, method, body, headers, signal) {
    if (!allowedTarget(remote.href)) throw new Error('Destination is outside the game allowlist');
    const repeatable = method === 'GET' || method === 'HEAD';
    for (let attempt = 0; attempt < (repeatable ? 3 : 1); attempt++) {
      if (signal?.aborted) throw signal.reason;
      const selected = await this.select();
      try {
        const response = await deadline(
          selected.transport.request(remote, method, body, headers, signal),
          45000, 'Game request timed out',
        );
        if ([502, 503, 504].includes(response.status)) throw new Error('Relay or upstream unavailable');
        return response;
      } catch (error) {
        if (this.current === selected) this.current = null;
        await closeSockets();
        this.report('Reconnecting…');
        if (!repeatable || attempt === 2) throw error;
      }
    }
  }

  connect() { throw new Error('This transport supports game downloads and HTTP requests only'); }
}
