import GameTransport from '../runtime/session.mjs?v=17';

export default class BrowserTransport extends GameTransport {
  async request(remote, method, body, headers, signal) {
    if (!['http:', 'https:'].includes(remote.protocol) || remote.username || remote.password) throw new Error('Unsupported address');
    const selected = await this.select();
    return selected.transport.request(remote, method, body, headers, signal);
  }
  async connect(url, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
    const remote = new URL(url);
    if (!['ws:', 'wss:'].includes(remote.protocol) || remote.username || remote.password) throw new Error('Unsupported address');
    const selected = await this.select();
    return selected.transport.connect(url, protocols, requestHeaders, onopen, onmessage, onclose, onerror);
  }
}
