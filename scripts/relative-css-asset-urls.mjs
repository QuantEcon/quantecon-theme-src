/**
 * Rewrite absolute asset URLs in the built stylesheets to be relative to the
 * stylesheet itself (#138).
 *
 * Remix rewrites every `url()` in a bundled stylesheet to
 * `${publicPath}_assets/<file>` — an absolute path, because `publicPath` is
 * also how it loads JS chunks and so cannot itself be relative. Under
 * `myst start` that resolves: `template/server.js` mounts `public/build` at
 * exactly that path. A static `myst build --html` has no such route, and
 * mystmd's asset rewriter only touches `.html`, `.js` and `.json` — never
 * `.css` — so the path inside the stylesheet keeps pointing at a directory the
 * output does not contain, and every font 404s.
 *
 * The stylesheets and the files they reference are emitted into the same
 * `_assets/` directory in both layouts, so a reference relative to the
 * stylesheet resolves in all of them:
 *
 *   myst start     /myst_assets_folder/_assets/x.css -> /myst_assets_folder/_assets/font.woff2
 *   static build   /build/_assets/x.css              -> /build/_assets/font.woff2
 *   under baseurl  <base>/build/_assets/x.css        -> <base>/build/_assets/font.woff2
 *
 * The last of those is a bug fixed in passing: an absolute `/myst_assets_folder`
 * ignores `baseurl` and breaks on project-scoped deployments such as the
 * per-PR GitHub Pages previews.
 *
 * Every rewritten target is checked to exist on disk, so a wrong assumption
 * here fails the build rather than shipping silent 404s.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Both read from the Remix config rather than hardcoded, so this cannot drift
// out of step with where the build actually puts things.
const { publicPath = '/', assetsBuildDirectory = 'public/build' } = require('../remix.config.prod.js');

const assetsDir = path.resolve(assetsBuildDirectory, '_assets');
const prefix = `${publicPath.endsWith('/') ? publicPath : `${publicPath}/`}_assets/`;
// url( optional-quote PREFIX file optional-quote )
const URL_RE = new RegExp(`url\\((\\s*['"]?)${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');

if (!fs.existsSync(assetsDir)) {
  console.error(`[css-assets] ${assetsDir} not found — run this after \`remix build\`.`);
  process.exit(1);
}

let rewritten = 0;
const missing = [];
// Validate everything before writing anything: a partial rewrite would leave
// the build output in a half-corrected state that is confusing to debug and
// worse to inherit if a later step ever runs despite the failure.
const pending = [];

for (const name of fs.readdirSync(assetsDir).filter((f) => f.endsWith('.css'))) {
  const file = path.join(assetsDir, name);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(URL_RE, 'url($1./');
  if (after === before) continue;

  for (const [, target] of after.matchAll(/url\(\s*['"]?\.\/([^)'"]+)['"]?\s*\)/g)) {
    const resolved = path.join(assetsDir, target.split(/[?#]/)[0]);
    if (!fs.existsSync(resolved)) missing.push(`${name} -> ${target}`);
  }

  rewritten += before.split(prefix).length - 1;
  pending.push([file, after]);
}

if (missing.length) {
  console.error(
    `[css-assets] ${missing.length} reference(s) do not exist beside their stylesheet:\n  ${missing.join('\n  ')}\n[css-assets] nothing written.`
  );
  process.exit(1);
}

for (const [file, contents] of pending) fs.writeFileSync(file, contents);
const filesTouched = pending.length;

console.log(
  `[css-assets] rewrote ${rewritten} asset URL(s) in ${filesTouched} stylesheet(s) to be stylesheet-relative`
);
