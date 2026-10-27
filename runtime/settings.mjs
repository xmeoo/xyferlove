import './settings.js?v=18';
export const {servers,assetBase,cattleBase,idleBase,slopeBase,hosts,allowedTarget}=globalThis.xyferSettings;
export function packAddress(value){return btoa(value).replaceAll('+','-').replaceAll('/','_').replaceAll('=','').split('').reverse().join('');}
export function unpackAddress(value){const b=value.split('').reverse().join('').replaceAll('-','+').replaceAll('_','/');return atob(b+'='.repeat((4-b.length%4)%4));}
