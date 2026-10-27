import RelayTransport from '../runtime/session.mjs?v=18';

// The browser has its own transport so the game's destination allowlist stays intact.
// RelayTransport tests candidates in parallel instead of waiting through every
// unavailable relay one at a time.
export default class BrowserTransport extends RelayTransport {
  async request(remote, method, body, headers, signal) {
    if (!['http:', 'https:'].includes(remote.protocol) || remote.username || remote.password) {
      throw new Error('Unsupported address');
    }
    const selected = await this.select();
    return selected.transport.request(remote, method, body, headers, signal);
  }

  connect(url, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
    const remote = new URL(url);
    if (!['ws:', 'wss:'].includes(remote.protocol) || remote.username || remote.password) {
      throw new Error('Unsupported address');
    }
    if (!this.current) throw new Error('Browser relay is not connected');
    return this.current.transport.connect(remote, protocols, requestHeaders, onopen, onmessage, onclose, onerror);
  }
}
