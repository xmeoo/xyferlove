import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedTarget, assetBase, cattleBase, idleBase, slopeBase, servers, packAddress, unpackAddress } from './settings.mjs';

test('only the pinned assets and HTTPS game API can use the transport', () => {
  for (const url of [assetBase+'gd_web.data.part1',assetBase+'gd_web.js',assetBase+'ref/logo.png','https://www.boomlings.com/database/getGJLevels21.php']) assert.equal(allowedTarget(url),true,url);
  for (const url of ['https://example.com/','http://www.boomlings.com/','https://boomlings.com.evil.test/','https://evil.test/?url='+assetBase,assetBase+'../../../../other/repo/file','https://user:pass@www.boomlings.com/','https://www.boomlings.com:444/','file:///etc/passwd',assetBase.replace('c6ac9417ff93ea957425b23ee87f1ed290663ebb','main')+'gd_web.js']) assert.equal(allowedTarget(url),false,url);
});

test('every supplied relay is unique and uses secure WebSockets',()=>{
  assert.equal(servers.length,27);
  assert.equal(new Set(servers).size,27);
  for(const value of servers) assert.equal(new URL(value).protocol,'wss:');
  for(let channel=0;channel<14;channel++) assert.ok(servers.includes('wss://velocify-notes.realdashvr.workers.dev/channel/'+channel));
});

test('address encoding preserves query strings and fragments',()=>{for(const value of [assetBase+'gd_web.js',assetBase+'gd_web.data.part1?x=a&b=2#test','https://www.boomlings.com/database/getGJLevels21.php']){const encoded=packAddress(value);assert.match(encoded,/^[A-Za-z0-9_-]+$/);assert.equal(unpackAddress(encoded),value);}});

test('asset origin differs from the app origin to avoid the engine self-origin guard',()=>{for(const origin of ['https://cdn.jsdelivr.net','https://xmeoo.github.io','http://127.0.0.1:8765'])assert.notEqual(new URL(assetBase).origin,origin);assert.match(assetBase,/\/c6ac9417ff93ea957425b23ee87f1ed290663ebb\/$/);});

test('Crazy Cattle downloads are limited to the pinned game repository',()=>{assert.equal(allowedTarget(cattleBase+'CrazyCattle3D.wasm'),true);assert.equal(allowedTarget(cattleBase+'CrazyCattle3D.pck'),true);assert.equal(allowedTarget(cattleBase.replace('bd686ee62e198459b7d978fe56d53d89cfbf62cd','main')+'CrazyCattle3D.wasm'),false);assert.equal(allowedTarget(cattleBase+'../../../../other/file'),false);});

test('Idle Breakout downloads are restricted to the pinned standalone build',()=>{for(const file of ['html5game/Coding_BreakOut1.js','assets/Coding_BreakOut1_texture_0.png','assets/audio/sound_0.ogg'])assert.equal(allowedTarget(idleBase+file),true);assert.equal(allowedTarget(idleBase.replace('38210ab1e9cf2ec914c6ab11074ab81a1cb606f3','main')+'game.html'),false);assert.equal(allowedTarget(idleBase+'../../../../other/file'),false);});

test('Slope downloads are restricted to the pinned Unity build',()=>{for(const file of ['data/slope_data.unityweb','data/slope_wasmcode.unityweb','data/slope_wasmframework.unityweb'])assert.equal(allowedTarget(slopeBase+file),true);assert.equal(allowedTarget(slopeBase.replace('960491c36a2aa35f3572907353f232cdba3161bb','main')+'data/slope.json'),false);assert.equal(allowedTarget(slopeBase+'../../../../other/file'),false);});
