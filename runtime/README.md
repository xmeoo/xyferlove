# Game download proxy

The player downloads game assets through the local Scramjet service worker, BareMux, Epoxy TLS, and one of the Wisp relays in `settings.js`. The CDN remains the origin of the game assets; the browser connects to it through Wisp instead of downloading those assets directly. The Xyfer site and its local proxy engine files still load from GitHub Pages.

Only the pinned game asset directory and HTTPS Boomlings endpoints are permitted. This is a game download integration, not a general browsing proxy. There is no direct-network fallback for game downloads. Failed GET/HEAD requests can move to another relay; POST requests are not replayed automatically. HTTP errors do not guarantee a relay is broken. Full game downloads are approximately 367 MB.

Relay selection tests a small PNG over HTTPS, checks its signature, then retains the first working connection. The supplied relays are tested one at a time; a socket opening alone does not qualify as success. If every group fails, the player displays an error. Availability can change. Wisp operators can see destination hosts and traffic metadata. Epoxy performs destination TLS in the browser; this is not a private or encrypted backend and is not an anonymity guarantee. Do not send sensitive account information through untrusted public relays.

This requires HTTPS (or localhost), service workers, and SharedWorkers. Use current Chrome or Edge. The SVG bootstraps a same-directory service worker. After worker activation, reloading the SVG URL serves the HTML application with an HTML content type while preserving the SVG URL. A supported browser with service workers enabled is required.

## Versions and sources

The matching stable-generation packages are deliberately pinned together:

- [Scramjet 1.1.0](https://www.npmjs.com/package/@mercuryworkshop/scramjet/v/1.1.0), AGPL-3.0, [source](https://github.com/MercuryWorkshop/scramjet).
- [BareMux 2.1.9](https://www.npmjs.com/package/@mercuryworkshop/bare-mux/v/2.1.9), MIT, [source](https://github.com/MercuryWorkshop/bare-mux).
- [Epoxy transport 2.1.28](https://www.npmjs.com/package/@mercuryworkshop/epoxy-transport/v/2.1.28), AGPL-3.0, [source](https://github.com/MercuryWorkshop/epoxy-transport), using epoxy-tls 2.1.18-1.

The new proxy integration files are provided under AGPL-3.0-only; see the vendored AGPL license. The public repository contains the integration source. Vendor files originate from the pinned npm distributions; internal storage and worker message names are isolated for Xyfer, with license notices and package provenance in `vendor/packages.json`. Scramjet's original source map contains its upstream TypeScript sources; the bundle changes only its IndexedDB database and BareMux channel identifiers. Epoxy transport's TypeScript source is included alongside its bundle. Exact upstream source distributions can be obtained from the tarball URLs in the provenance file.

## Addresses and traffic

Address configuration and local request-path addresses use reversed Base64 (URL-safe for paths). This is reversible obfuscation, not secret storage or an encryption boundary. Public source, browser developer tools, required upstream notices, and decoded values can still identify the software and destinations. Names in the interface and app-owned paths are neutral; required third-party notices are preserved.

One active relay WebSocket is permitted per game player. Requests reuse that connection. Failed connections are closed before another candidate is tested. Opening multiple game-player tabs can create multiple connections. WSS encrypts the browser-to-relay connection; destination HTTPS is handled by Epoxy. Site startup assets still arrive from the visible host. No traffic-analysis resistance, undetectability, custom end-to-end tunnel encryption beyond TLS, padding, or packet batching is claimed. Those features require an explicitly supported server protocol; the public relays are outside this project's control.

The game loader, proxy libraries, and compiled game JavaScript are hosted locally. Large data/WASM files are fetched on game launch. Game tiles are instantiated on opening Games; the game document is loaded only on opening its tile. Readiness uses a message from the loaded game module rather than an iframe load event. The title and URL are not disguised as another service.

## SVG startup

The referenced [Velocify SVG](https://cdn.jsdelivr.net/gh/velxlmao/velocify-static@main/index.svg) registers a same-directory worker, waits for activation, verifies a readiness message, and reloads. Its [worker](https://cdn.jsdelivr.net/gh/velxlmao/velocify-static@main/sw.js) intercepts navigations to `index.svg`, fetches `index.html`, and returns it as `text/html`. The visible SVG URL stays in place. Xyfer uses the same browser capability, with its own implementation and app-specific scope.

The browser receives an actual SVG on a first visit, so script can install the worker. After installation, the response at that address is HTML generated by the browser worker. GitHub/jsDelivr still serve only static files; neither runs a private backend. SVGs embedded as images do not execute this startup flow. Browsers that disable service workers or local storage may not support it. Startup storage is initialized before the engine to avoid empty IndexedDB stores.
