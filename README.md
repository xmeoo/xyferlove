# Xyfer

A title-only landing page with animated red and black gradients. No build, dependencies, tracking, or external assets.

Upload `index.svg` and `index.html` to the **public** GitHub repository `xmeoo/xyferlove`, on branch `main`.

The SVG will then be available at:

https://cdn.jsdelivr.net/gh/xmeoo/xyferlove@main/index.svg

This URL is a static SVG document. `index.html` is also included for conventional web hosting such as GitHub Pages. SVG animation respects reduced-motion preferences. The full-bleed composition crops to the viewport while keeping the title centered.

## Backend

There is no backend in this initial title-only version. GitHub file hosting and jsDelivr cannot execute private server code. Public files cannot contain secrets, even if obfuscated or encrypted with a key included in the client. A future backend needs a separately hosted HTTPS API, server-side secrets, authentication where needed, and encrypted storage where appropriate.

## Updates

jsDelivr caches files, so branch-based URLs may take time to reflect updates. Use a commit SHA in place of `main` for an exact version.
