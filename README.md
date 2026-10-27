# Xyfer

Animated red and black landing page with a Games library.

- Website: https://xmeoo.github.io/xyferlove/
- Games: https://xmeoo.github.io/xyferlove/#games
- SVG landing: https://cdn.jsdelivr.net/gh/xmeoo/xyferlove@main/index.svg

The SVG installs a same-directory worker, verifies readiness, then reloads. The worker serves the HTML app at the SVG URL with the correct HTML content type. Games stays on the jsDelivr address. GitHub Pages is available as an alternative.

## Geometry Dash

`games/geometry-dash/index.html` adapts the loader from https://github.com/AlexBoops/geometry-dash-webport at commit c6ac9417ff93ea957425b23ee87f1ed290663ebb. Original upstream credit: bog / truffled. The compiled game JavaScript is hosted locally; large data and WASM assets load from that pinned upstream repository through GitHub's raw-file host, routed through Scramjet, Epoxy TLS and the user-supplied Wisp relays. No game binaries are copied into this repository.

Changes to the upstream loader: correct and pin asset URLs, remove analytics, and remove root service-worker registration for compatibility with project Pages hosting. The old CodeTabs/Cloudflare HTTP proxy routes are replaced with the Wisp transport, including HTTPS Boomlings API requests. See [runtime/README.md](runtime/README.md) for transport behavior, pinned dependency sources, and limitations. Initial game downloads total approximately 367 MB; desktop browsers are recommended.

No private backend or secrets are included.

Game assets have no direct-download fallback. Site files still load normally from GitHub Pages/jsDelivr.

## Crazy Cattle 3D and artwork

The library includes local Geometry Dash and Crazy Cattle 3D icons. Geometry Dash's cover comes from GN Math's `covers/868.png`; Crazy Cattle's sheep icon comes from its Godot export. Artwork remains credited to the original game creators.

Crazy Cattle 3D is by Anna Mayberry / 4nn4t4t. This integration follows [GN Math entry 164](https://gn-math.dev/?id=164), which uses `164-fix3.html` from gn-math/html at 5639f84d67456355a3c807a0f52b41c346b3385d and the mobile-capable Godot export from genizy/cc3d-mobile at bd686ee62e198459b7d978fe56d53d89cfbf62cd. Startup JavaScript, audio worklets, and artwork are local; the pinned 28.6 MB pack and 43.4 MB WASM load through the existing transport only when the game is opened. GN Math's ads, analytics, broad document replacement, and separate service worker are not imported.

The game is exported without threads, so it does not require a second worker or cross-origin-isolation installation. WASM responses receive the MIME type required by streaming compilation.

One upstream audio-position worklet syntax typo (`event ? .data ? .type`) is corrected to valid optional chaining. Upstream Godot license notices are retained.

## Idle Breakout

Idle Breakout is by Kodiqi. The replacement standalone GameMaker build comes from https://github.com/SoBloxsy/idle-breakout pinned at 38210ab1e9cf2ec914c6ab11074ab81a1cb606f3. The icon remains from Kodiqi's itch.io page. The prior official itch.io iframe is removed.

The local launcher downloads the game script, textures and audio through the existing download transport only when opened. The exact file manifest is in games/idle-breakout/files.json. Image, media and XHR requests use downloaded blob resources; MP3 requests map to the build's Ogg audio. The game script is downloaded rather than redistributed in this checkout. No external embed or third-party storage permission is required.

The pinned build's save-key function is set to the stable xyfer.idle-breakout.v1. namespace in first-party localStorage, independent of release paths. Its own save serializer runs every ten seconds and on page hiding/exit in addition to native autosave. Startup checks that storage can be read and written. Saves persist across Xyfer release tags on the same host/browser; clearing site data, private browsing, or changing host/browser affects saves. Earlier itch.io saves are not automatically migrated.
