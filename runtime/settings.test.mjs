import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedTarget, assetBase, servers, packAddress, unpackAddress } from './settings.mjs';

test('only the pinned assets and HTTPS game API can use the transport', () => {
  for (const url of [assetBase+'gd_web.data.part1',assetBase+'gd_web.js',assetBase+'ref/logo.png','https://www.boomlings.com/database/getGJLevels21.php']) assert.equal(allowedTarget(url),true,url);
  for (const url of ['https://example.com/','http://www.boomlings.com/','https://boomlings.com.evil.test/','https://evil.test/?url='+assetBase,assetBase+'../../../../other/repo/file','https://user:pass@www.boomlings.com/','https://www.boomlings.com:444/','file:///etc/passwd',assetBase.replace('@c6ac9417ff93ea957425b23ee87f1ed290663ebb','@main')+'gd_web.js']) assert.equal(allowedTarget(url),false,url);
});

test('every supplied relay is unique and uses secure WebSockets',()=>{
  assert.equal(servers.length,27);
  assert.equal(new Set(servers).size,27);
  for(const value of servers) assert.equal(new URL(value).protocol,'wss:');
  for(let channel=0;channel<14;channel++) assert.ok(servers.includes('wss://velocify-notes.realdashvr.workers.dev/channel/'+channel));
});

test('address encoding preserves query strings and fragments',()=>{for(const value of [assetBase+'gd_web.js',assetBase+'gd_web.data.part1?x=a&b=2#test','https://www.boomlings.com/database/getGJLevels21.php']){const encoded=packAddress(value);assert.match(encoded,/^[A-Za-z0-9_-]+$/);assert.equal(unpackAddress(encoded),value);}});
