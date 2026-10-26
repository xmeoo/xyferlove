# Game download proxy

The player downloads game assets through the local Scramjet service worker, BareMux, Epoxy TLS, and one of the Wisp relays in `servers.mjs`. The CDN remains the origin of the game assets; the browser connects to it through Wisp instead of downloading those assets directly. The Xyfer site and its local proxy engine files still load from GitHub Pages.

Only the pinned game asset directory and HTTPS Boomlings endpoints are permitted. This is a game download integration, not a general browsing proxy. There is no direct-network fallback for game downloads. Failed GET/HEAD requests can move to another relay; POST requests are not replayed automatically. HTTP errors do not guarantee a relay is broken. Full game downloads are approximately 367 MB.

Relay selection tests a small PNG over HTTPS, checks its signature, then retains the first working connection. The supplied relays are tested in groups of three; a socket opening alone does not qualify as success. If every group fails, the player displays an error. Availability can change. Wisp operators can see destination hosts and traffic metadata. Epoxy performs destination TLS in the browser; this is not a private or encrypted backend and is not an anonymity guarantee. Do not send sensitive account information through untrusted public relays.

This requires HTTPS (or localhost), service workers, and SharedWorkers. Use current Chrome or Edge. It cannot execute inside a static SVG on jsDelivr: the SVG Games link opens the GitHub Pages HTML player.

## Versions and sources

The matching stable-generation packages are deliberately pinned together:

- [Scramjet 1.1.0](https://www.npmjs.com/package/@mercuryworkshop/scramjet/v/1.1.0), AGPL-3.0, [source](https://github.com/MercuryWorkshop/scramjet).
- [BareMux 2.1.9](https://www.npmjs.com/package/@mercuryworkshop/bare-mux/v/2.1.9), MIT, [source](https://github.com/MercuryWorkshop/bare-mux).
- [Epoxy transport 2.1.28](https://www.npmjs.com/package/@mercuryworkshop/epoxy-transport/v/2.1.28), AGPL-3.0, [source](https://github.com/MercuryWorkshop/epoxy-transport), using epoxy-tls 2.1.18-1.

The new proxy integration files are provided under AGPL-3.0-only; see the vendored AGPL license. The public repository contains the integration source. Vendor files are unmodified npm distribution files, with license notices and package provenance in `vendor/packages.json`. Scramjet's source map contains its TypeScript sources. Epoxy transport's TypeScript source is included alongside its bundle. Exact upstream source distributions can be obtained from the tarball URLs in the provenance file.
