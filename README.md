# Xyfer

Animated red and black landing page with a Games library.

Settings can save a custom tab title, a generic tab icon, and one of five color themes in the browser's local storage.

Home includes an embedded browser with an address bar and app shortcuts. The Apps tab opens Discord, Spotify, YouTube, and Reddit inside that browser. Browser pages use a separate service worker scope and the bundled Scramjet/Wisp transport. Availability depends on the configured relays and each app's compatibility with the rewriting engine. The interface uses a locally hosted Manrope font under the SIL Open Font License 1.1.

- Website: https://xmeoo.github.io/xyferlove/
- Games: https://xmeoo.github.io/xyferlove/#games
- Chat: https://xmeoo.github.io/xyferlove/#chat
- SVG landing: https://cdn.jsdelivr.net/gh/xmeoo/xyferlove@main/index.svg

The SVG installs a same-directory worker, verifies readiness, then reloads. The worker serves the HTML app at the SVG URL with the correct HTML content type. Games stays on the jsDelivr address. GitHub Pages is available as an alternative.

## Geometry Dash

`games/geometry-dash/index.html` adapts the loader from https://github.com/AlexBoops/geometry-dash-webport at commit c6ac9417ff93ea957425b23ee87f1ed290663ebb. Original upstream credit: bog / truffled. The compiled game JavaScript is hosted locally; large data and WASM assets load from that pinned upstream repository through GitHub's raw-file host, routed through Scramjet, Epoxy TLS and the user-supplied Wisp relays. No game binaries are copied into this repository.

Changes to the upstream loader: correct and pin asset URLs, remove analytics, and remove root service-worker registration for compatibility with project Pages hosting. The old CodeTabs/Cloudflare HTTP proxy routes are replaced with the Wisp transport, including HTTPS Boomlings API requests. See [runtime/README.md](runtime/README.md) for transport behavior, pinned dependency sources, and limitations. Initial game downloads total approximately 367 MB; desktop browsers are recommended.

No private backend or secrets are included.

## Public chat

The Chat tab is an anonymous, live peer-to-peer room built with [Trystero](https://github.com/dmotz/trystero) 0.26.0 and its public Nostr signaling strategy. Messages travel directly between connected browsers and are not stored on a Xyfer server. The interface includes saved local display names, online presence, 400-character messages, incoming rate limits, and session-only blocking.

The room has no permanent history, accounts, or server moderation. Everyone leaves the room when their tab closes, and network policies that block WebRTC or public Nostr relays can prevent a connection. A single WebRTC room is intended for a modest number of simultaneous visitors.

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

## Slope

Slope is integrated from the clean Unity WebGL build at https://github.com/mcalec-dev/slope-game, pinned to commit `960491c36a2aa35f3572907353f232cdba3161bb`. The repository identifies the game as Slope Game by IDnet. Its small Unity loader is hosted locally; the approximately 14 MB Unity data, framework, memory and WASM files download through the existing transport only when Slope is opened. The game icon is GN Math's `covers/198.png`. The integration adds no advertisements or analytics.

## 2048 and Hextris

2048 is imported from https://github.com/gabrielecirulli/2048 at commit `478b6ec346e3787f589e4af751378d06ded4cbbc` under its MIT license. Hextris is imported from https://github.com/Hextris/hextris at commit `3f4847dc8fd7dab3d1c87e6324b9159d92fbd396` under GPL-3.0. Both games and their icons are hosted locally. Hextris's legacy advertisements, analytics, store badges, and social-share controls are removed.

## Block Blast, FNAE, and FNAF 1–4

The mislabeled Block Blast build from SomeRandomFella/portsandrips was replaced with the actual 8×8 block puzzle implementation from SubPomel0/Block-Blast at commit `a0d6b6647855a0e917c8f6b5b133b0ed23da44eb`. FNAE uses web-ports/fnae at commit `ce3e15db144629f468916e186bc11547098706a2`. FNAF 1–4 use irv77/hd_fnaf at commit `8ddade73bcf0c30f4535d48af778d238f8ffd5a6`.

Block Blast is hosted locally. The large FNAE and FNAF assets remain pinned at their upstream repositories and load only when opened. Approximate downloads are 156 MB for FNAE, 167 MB for FNAF 1, 182 MB for FNAF 2, 191 MB for FNAF 3, and 357 MB for FNAF 4.

## Fears to Fathom: Home Alone

The Games library includes the web port from [genizy/web-port](https://github.com/genizy/web-port/tree/a8bea5fd11f88e5a9192857f434e299c40efe7e6/fears-to-fathom/home-alone), pinned to commit `a8bea5fd11f88e5a9192857f434e299c40efe7e6`. Fears to Fathom is by Rayll; the port identifies slqntdevss as its author. The Unity loader, 39 split data files, and WASM files download from that commit through the existing game transport only after Play is pressed. The data files total about 806 MB, so a desktop browser with ample memory is recommended. The checkout contains a local launcher and original library icon; it does not redistribute the upstream game files.

## Extended web port catalog

The Games library also links 36 playable builds found through [Carter54git's Ultimate Catalog of Web Game Ports](https://github.com/Carter54git/Ultimate-Catalog-Of-Web-Game-Ports/tree/fb8a292b212a3795ac05634b72c0eb7e17c1b4e6). This batch includes Slime Rancher, 20 Minutes Till Dawn, Bad Piggies, Bendy, Brotato, Celeste, Clover Pit, Cruelty Squad, Deltatraveler, Doom 3, Duck Life 8, Endoparasitic, Fallout, Fear & Hunger, Getting Over It, Granny, Half-Life, Helltaker, Hollow Knight, Hollow Knight: Silksong, Iron Lung, Just Shapes & Beats, Minecraft Pocket Edition, MiSide, Pizza Tower: Scoutdigo, Plants vs. Zombies GOTY, Sonic CD, Sonic Mania, Stardew Valley, Super Mario 64, Terraria, Totally Accurate Battle Simulator, ULTRAKILL, Untitled Goose Game, Who's Your Daddy?, and Your Only Move is Hustle.

Each entry opens the selected build in GN Math's direct embed mode so its asset downloader runs on the origin it requires. Downloads start only after the user selects a game. The library stores optimized local copies of the ports' real cover images. Xyfer does not copy the game binaries. Availability, browser storage, controls, download size, and device support vary by port.
