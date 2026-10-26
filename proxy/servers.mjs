// User-supplied relays. Availability is checked with an HTTPS asset request.
export const servers = [
  'wss://velocify-notes.realdashvr.workers.dev/channel/0',
  'wss://t9os.space/wisp-vps/',
  'wss://girlspreples.org/wi/',
  'wss://boxcasa.net/wi/',
  'wss://shop.kristenblackburnvolleyballcamps.com/wi/',
  'wss://learn.southpadreislandkiteboarding.com/wi/',
  'wss://bananadogstore.com/socket/',
  'wss://aplusmartialarts-templehills.com/socket/',
  'wss://actingoutdoor.com/socket/',
  'wss://restorecounselingcenter.org/socket/',
  'wss://t9os.space/wisp-boston/',
  'wss://t9os.space/wisp-milan/',
  'wss://t9os.space/wisp-paloalto/',
  'wss://t9os.space/wisp-mullvad/',
  ...Array.from({ length: 13 }, (_, i) => `wss://velocify-notes.realdashvr.workers.dev/channel/${i + 1}`),
];

export const assetBase = 'https://cdn.jsdelivr.net/gh/AlexBoops/geometry-dash-webport@c6ac9417ff93ea957425b23ee87f1ed290663ebb/';

export function allowedTarget(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (
      url.href.startsWith(assetBase) ||
      url.hostname === 'www.boomlings.com' || url.hostname === 'boomlings.com'
    );
  } catch { return false; }
}
