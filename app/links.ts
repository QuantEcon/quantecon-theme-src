import type { HtmlLinkDescriptor } from '@remix-run/react';
import katexCss from 'katex/dist/katex.min.css';

/**
 * Self-hosted KaTeX stylesheet.
 *
 * Replaces the `KatexCSS` export from `@myst-theme/site`, which points at
 * `cdn.jsdelivr.net`. Two reasons to serve it ourselves:
 *
 *   1. Accessibility. jsdelivr is intermittently unreachable from mainland
 *      China, where a significant share of QuantEcon readers are. When it is
 *      blocked the maths markup still renders but is completely unstyled —
 *      fractions, radicals and matrices collapse into run-together text — so
 *      the lectures become unreadable exactly where they matter most.
 *   2. The critical path. It was a render-blocking stylesheet on a third
 *      origin, so first paint waited on a DNS lookup and TLS handshake.
 *
 * Remix fingerprints this import and emits it, plus the 60 font files it
 * references, into `public/build/_assets/` — served at `/myst_assets_folder/`
 * (remix.config.*.js `publicPath`), the same path as every other bundled
 * asset. The browser only downloads the handful of font faces a page's glyphs
 * actually need, not all twenty.
 *
 * The upstream export also pins KaTeX 0.15.2 while this repo resolves 0.16.x;
 * importing from the package keeps the CSS aligned with the installed version.
 * `katex` is declared directly in package.json rather than relied on as a
 * hoisted transitive dependency of `myst-transforms` / `mermaid`.
 */
export const KatexCSS: HtmlLinkDescriptor = {
  rel: 'stylesheet',
  href: katexCss,
};
