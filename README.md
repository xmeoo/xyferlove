# Xyfer

Animated red and black landing page with a Games library.

- Website: https://xmeoo.github.io/xyferlove/
- Games: https://xmeoo.github.io/xyferlove/#games
- SVG landing: https://cdn.jsdelivr.net/gh/xmeoo/xyferlove@main/index.svg

The SVG Games link opens the HTML library on GitHub Pages. jsDelivr serves HTML as text and cannot host the interactive player itself.

## Geometry Dash

`games/geometry-dash/index.html` adapts the loader from https://github.com/AlexBoops/geometry-dash-webport at commit c6ac9417ff93ea957425b23ee87f1ed290663ebb. Original upstream credit: bog / truffled. The game binaries and images load from that pinned upstream repository through jsDelivr; no binaries are copied into this repository.

Changes to the upstream loader: correct and pin asset URLs, remove analytics, and remove root service-worker registration for compatibility with project Pages hosting. Upstream online level services depend on third-party proxies. Initial game downloads total approximately 367 MB; desktop browsers are recommended.

No private backend or secrets are included.
