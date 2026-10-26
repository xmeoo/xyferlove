import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { assetBase, allowedTarget, packAddress } from './settings.mjs';

test('received config initializes engine globals before concurrent file requests', async () => {
  const handlers = new Map();
  let initialized = false;
  let loads = 0;
  let requests = 0;
  class Engine {
    // Reproduce the upstream behavior after a controller config message.
    config = { prefix: '/received-config/' };
    async loadConfig() {
      if (this.config) return;
      loads++;
      await Promise.resolve();
      this.config = { prefix: '/loaded-config/' };
      initialized = true;
    }
    async fetch({ request, clientId }) {
      assert.equal(initialized, true, 'engine globals must be initialized');
      assert.equal(request.referrer, '', 'raw player referrers must not enter the URL decoder');
      assert.equal(clientId, 'player');
      requests++;
      return new Response('chunk', { status: 200 });
    }
  }
  const scope = 'https://cdn.jsdelivr.net/gh/xmeoo/xyferlove@release/';
  const context = vm.createContext({
    URL, Request, Response, atob,
    importScripts() {},
    $scramjetLoadWorker: () => ({ ScramjetServiceWorker: Engine }),
    xyferSettings: { allowedTarget },
    xyferPrepareStorage: async path => assert.equal(path, new URL(scope).pathname),
    self: {
      location: new URL('worker.js', scope),
      addEventListener: (name, callback) => handlers.set(name, callback),
      skipWaiting() {},
      clients: { claim() {} },
    },
  });
  vm.runInContext(await readFile(new URL('../worker.js', import.meta.url), 'utf8'), context);
  function fetchChunk(part) {
    const request = new Request(scope + 'runtime/data/' + packAddress(assetBase + 'gd_web.data.part' + part), {
      referrer: scope + 'games/geometry-dash/',
    });
    let response;
    handlers.get('fetch')({ request, clientId: 'player', respondWith(value) { response = value; } });
    return response;
  }
  const responses = await Promise.all([fetchChunk(1), fetchChunk(2)]);
  assert.deepEqual(responses.map(response => response.status), [200, 200]);
  assert.equal(loads, 1);
  assert.equal(requests, 2);
});
