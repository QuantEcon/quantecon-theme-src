# Changelog

All notable changes to `@quantecon/lecture-theme` (the QuantEcon MyST theme) are
documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Release flow.** This theme is developed in
> [`QuantEcon/quantecon-theme.mystmd`](https://github.com/QuantEcon/quantecon-theme.mystmd)
> (renamed from `quantecon-theme-src` on 2026-06-11; old links redirect). Each release
> is a `vX.Y.Z` git tag: pushing the tag triggers `release.yml`, which builds the theme
> and publishes a GitHub Release with `quantecon-theme.zip` attached, using that
> version's section of this file as the release notes (see
> [`CONTRIBUTING.md`](./CONTRIBUTING.md)). Releases ≤ 2.0.0 predate the pipeline and
> were deploy commits (`🚀 vX.Y.Z from <sha>`) to the legacy build repo
> [`QuantEcon/quantecon-theme`](https://github.com/QuantEcon/quantecon-theme), now
> **archived** — consumers point at pinned release URLs (see Phase 0 in
> [`PLAN.md`](./PLAN.md)).

## [Unreleased]

## [2.3.1] - 2026-08-26

> Headline: corrects two defects in what 2.3.0 shipped. Code cells nested inside
> a directive (`{exercise}`, `{solution}`, `{note}`) drew a run button that did
> nothing; they now register with the kernel and execute. Self-hosted stylesheet
> assets 404'd in `myst build --html` output, so every KaTeX font failed and
> maths fell back to system glyphs on statically built sites; asset URLs are now
> relative and resolve in every layout. Source Sans 3 is self-hosted too,
> removing the last third-party origin from the critical rendering path.
> Consumers upgrade by bumping the pinned release URL in `site.template`.

### Added
- Visual-fixture coverage for fancy ordered lists **inside a directive**.
  `tests/visual/fixture/lists.md` gains a `prf:theorem`-wrapped stamped list,
  and `lists-markers` asserts it renders with the same `type`, `start`,
  `list-lower-roman delimiter-parens` classes and drawn marker as the
  equivalent body-level list. Every fixture list previously sat in the page
  body, so `LIST_RENDERERS` reaching the `prf:*` subtree was accidental rather
  than asserted: it works because `myst-to-react`'s proof renderer passes its
  children through the same `<MyST/>` dispatcher, and because nothing in
  `styles/lists.css` scopes a selector to body-vs-proof. Both are load-bearing
  and neither was pinned, so a change to either would silently return the ~330
  list items across the dp books' 118 `prf:*` blocks to decimal markers — a
  regression far too small in area for the snapshot diff budget, which is why
  it is asserted against the DOM
  ([#121](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/121)).

### Changed
- Source Sans 3 is now self-hosted instead of `@import`ed from
  `fonts.googleapis.com`. Google Fonts is blocked in mainland China, a
  significant share of the QuantEcon readership, and unlike the CDN stylesheets
  removed in 2.3.0 this one is the *body* font on every page rather than the
  maths on some of them. It also had the worst possible shape for a
  critical-path request: a CSS `@import`, discovered only after `app.css` had
  downloaded and parsed, so the browser could not preload it and the chain ran
  `app.css` → Google's CSS → `fonts.gstatic.com` woff2 across two extra origins.
  The font now ships from `@fontsource-variable/source-sans-3` through the same
  Remix import route the KaTeX CSS uses, so its 14 `.woff2` files are served
  from the site's own origin. The family is declared as `Source Sans 3
  Variable`, so `tailwind.config.js` and the inlined critical CSS in
  `app/root.tsx` name it that way too, with plain `Source Sans 3` kept next in
  the stack for a locally installed copy. Rendered text is unchanged in
  substance, but the `@fontsource` build's glyph metrics differ marginally from
  the Google-served static font, enough to re-wrap a line at the mobile
  viewport — so the linux mobile-chrome baselines were refreshed
  ([#148](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/148)); every
  desktop baseline is untouched
  ([#131](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/131)).

### Fixed
- Code cells nested inside a directive (`{exercise}`, `{solution}`, `{note}`, …)
  are now registered with the kernel, so their run button works and their
  outputs survive a kernel connection. `@myst-theme/jupyter`'s
  `notebookFromMdast` walked only the mdast root's direct children, so a cell at
  `root > block > exercise > block[kind=notebook-code]` never entered
  `notebook.cells` or the `idkmap` — while the renderer matches
  `block[kind=notebook-code]` at any depth and drew a run button anyway.
  Clicking it logged `no cell found on execute` and did nothing, with no error
  visible to the reader; on a live-compute page the cell's pre-baked outputs
  also blanked as soon as the kernel attached, because the active output
  renderer could not find a cell to bind to. Fixed by a third `patches/` entry
  (`@myst-theme+jupyter+1.3.0.patch`) that walks nested blocks depth-first and
  appends them in document order — which is execution order — while skipping
  `{embed}` subtrees, whose cells belong to another page's notebook and would
  otherwise collide in the shared key map. The existing
  `block > container > code` figure case and the markdown-cell fallback are
  unchanged. Note that nested cells now participate in **Run all**, so solution
  and exercise cells execute along with the rest of the page.
  ([#117](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/117))
- Self-hosted stylesheet assets no longer 404 in static builds. Remix rewrites
  every `url()` in a bundled stylesheet to an absolute `/myst_assets_folder/…`
  path, which resolves under `myst start` — the theme's own server mounts
  `public/build` there — but not in `myst build --html` output, where the assets
  land under `build/_assets/` and mystmd's rewriter only fixes up `.html`, `.js`
  and `.json`, never `.css`. So the KaTeX stylesheet self-hosted in
  [#125](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/125) loaded
  while all 60 of its font references failed, and maths fell back to system
  glyphs on every statically built site — the degradation that change set out to
  prevent. The build now rewrites those references to be relative to the
  stylesheet, which resolves identically under `myst start`, in a static build,
  and under a `baseurl` (where the absolute path was also wrong, affecting the
  per-PR preview deployments). Every rewritten target is checked to exist beside
  its stylesheet, so a wrong assumption fails the build instead of shipping
  silent 404s ([#138](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/138)).

## [2.3.0] - 2026-08-20

> Headline: lecture pages gain **in-page live compute** (a JupyterLite/Pyodide
> Power toggle in the header toolbar) and an inline **git-history changelog** on
> the page header's author line. All third-party CDN stylesheets are gone —
> KaTeX and jupyter-matplotlib are served from the site's own origin and Font
> Awesome is dropped — so maths and styling no longer degrade where
> jsdelivr/cdnjs are unreachable (notably mainland China). Consumers upgrade by
> bumping the pinned release URL in `site.template`.

### Added
- In-page live compute via Thebe (Phase 2 of [`PLAN.md`](./PLAN.md), closes #88):
  setting the standard MyST `project.thebe` config surfaces a **Power** toggle in
  the header toolbar next to Launch on notebook pages (desktop); clicking it boots
  the kernel, after which **Run / Restart / Clear** take its place and cells
  execute live. The control is the `@myst-theme/jupyter` notebook toolbar,
  portaled into the header (`ComputeToolbarSlot.tsx` → `#qe-compute-slot`) so it
  stays inside the Thebe providers while living in the always-visible header —
  no provider-tree lift. The QuantEcon default is **JupyterLite**
  (`thebe: { lite: true }`): Python runs in the browser via Pyodide, with no
  server or Binder to host; `binder:`/`server:` backends remain available through
  the same config. Pyodide package caveat (numba/JAX unavailable) documented in
  the README. Covered by a presence test scoped to the header slot and a
  disabled-path test against a second no-thebe fixture served on its own port,
  proving the toggle is gated on the project opting in ([#98](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/98)).
- Git history in page headers (Phase 1 of [`PLAN.md`](./PLAN.md)): a "Last
  changed" control on the page-header author line expands an inline changelog
  with GitHub-linked commit hashes and a full-history link, mirroring the
  `quantecon-book-theme` header. The panel opens above the header's blue
  divider, pushing it down and sitting flush on it, so the divider reads as the
  panel's own bottom edge and the changelog stays clear of the lecture content.
  It grows to fit rather than scrolling — length is bounded at the source, with
  the plugin capping entries per page (default 6). Data is injected at build
  time by a new MyST
  transform plugin (`plugins/git-metadata.mjs`, `git log --follow` per page →
  `mdast.data.git_metadata`), with a `site.git_metadata` page-frontmatter
  override for manual pinning. mystmd has no built-in last-modified support
  (jupyter-book/mystmd#2213), and plugin transforms cannot modify page
  frontmatter, hence the AST channel
  ([#83](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/83)).

### Changed
- The KaTeX and jupyter-matplotlib stylesheets are now served from the site's
  own origin instead of `cdn.jsdelivr.net`. jsdelivr is intermittently
  unreachable from mainland China, and when it is blocked the maths markup
  still renders but arrives unstyled — fractions, radicals and matrices
  collapse into run-together text. The KaTeX CSS (plus the font files it
  references) is bundled from the installed `katex` package, which also retires
  the KaTeX 0.15.2 pin in the upstream `KatexCSS` export; the 316-byte
  jupyter-matplotlib stylesheet is vendored into the Tailwind bundle, costing
  no request at all
  ([#125](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/125)).

### Removed
- The render-blocking Font Awesome 4.7 stylesheet from cdnjs. Nothing used it:
  the theme renders no `fa-*` classes (the toolbar uses the bundled
  `lucide-react` icons), and the library has been end-of-life since 2016.
  Dropping it removes a third-party origin (a DNS lookup and TLS handshake)
  from the critical rendering path
  ([#124](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/124)).

### Fixed
- Contents sidebar no longer flashes open on page load. On static builds the
  first paint can happen before `app.css` applies, leaving the panel in flow and
  fully visible; it then animated itself shut over 300ms because the transition
  predated the stylesheet. The inlined critical CSS now parks the panel
  off-screen on that first frame, and the transition is withheld until after
  mount ([#123](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/123)).

## [2.2.0] - 2026-07-16

> Headline: fancy ordered lists — `(a)` / `(i)` / `B)` markers from the QuantEcon
> mystmd fork's fancy-lists parser now render correctly in HTML site builds
> (previously they fell back to `1.` / `2.` / `3.`). Consumers upgrade by bumping
> the pinned release URL in `site.template`.

### Fixed
- The notebook-launch toolbar trigger now has an accessible name (`aria-label="Launch notebook"`); previously it exposed no name to assistive technology. Added alongside the first regression coverage of the launch popover (Colab URL + default selection — BinderHub was deliberately not added, see [#26](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/26)).
- Fancy ordered lists (`(a)`, `iv.`, `B)` — QuantEcon/mystmd#50) now render their markers instead of falling back to decimals: a custom `list` renderer maps the node's `style` to the `<ol type>` attribute plus a case-sensitive `list-*` class (HTML matches `[type=...]` case-insensitively, so CSS keyed off the attribute cannot tell `a` from `A`) and exposes `delimiter` as a `delimiter-paren(s)` class, with counter-based CSS drawing the parenthesized markers ([#100](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/100)). Interim override until the fix lands upstream in `myst-to-react` (tracked in QuantEcon/mystmd#51). Covered by a new `lists` visual-regression fixture page whose markers are stamped by a fixture-local transform (`fancy-lists.mjs`) — so the coverage is independent of whether the building CLI parses fancy-list markers — plus DOM-level marker assertions (`lists-markers`), since a wrong marker case moves too few pixels for the snapshot diff budget.

### Added
- Per-PR rendered previews on GitHub Pages (`.github/workflows/preview.yml`): each PR statically builds the real `lecture-python-programming` lectures with the candidate theme (`myst build --html`, including the build-time Jupyter Book → MyST upgrade) and publishes to `gh-pages` at `pr-preview/pr-<n>/` with a sticky link comment and teardown on close. Self-contained on `GITHUB_TOKEN` — no external preview service.

### Removed
- Retire the `make deploy` / `deploy-theme` targets — releases ship exclusively via the tag-triggered GitHub Release workflow, and the legacy build repo (`QuantEcon/quantecon-theme`) is archived. `make build-theme` now assembles the bundle locally instead of cloning the archived repo (so the CI test harness no longer depends on it), and a new `make build-zip` produces the release-equivalent zip for local artifact testing ([#81](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/81)).

## [2.1.0] - 2026-06-11

> First release published through the tag-triggered pipeline, from the renamed
> `quantecon-theme.mystmd` repo (Phase 0 of [`PLAN.md`](./PLAN.md)).

### Added
- Visual-regression CI gate: a `visual` job pixel-diffs the fixture (desktop + mobile Chromium, now including a sidebar-open snapshot — the off-canvas sidebar was invisible to the existing full-page shots) against committed platform-suffixed baselines on every PR, posts a 🎭 results summary comment, and uploads report/diff artifacts; baselines are refreshed by commenting `/update-snapshots` (or `/update-new-snapshots`) on the PR ([#78](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/78)).
- Tag-triggered release pipeline (`.github/workflows/release.yml`): pushing a `vX.Y.Z` tag builds the theme, assembles the bundle (with `template.yml`'s `version` stamped from `package.json` so they cannot drift), and publishes a GitHub Release with `quantecon-theme.zip` attached, using the version's changelog section as the release notes ([#77](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/77)).

### Fixed
- Top-level (level-1) TOC pages now render as clickable links in the Contents sidebar when they have a slug, so flat-TOC projects are navigable; slug-less grouping titles remain plain headers ([#76](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/76)).
- Safari/WebKit flash of unstyled content (FOUC) on page navigation: inline a zero-specificity (`:where(...)`) critical-CSS block (base font + `.simple-center-grid` layout) in the document `<head>` so the first paint is already styled before the linked stylesheet applies ([#66](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/66)).

### Security
- Resolve backward-compatible Dependabot advisories via npm `overrides` — `uuid` (`^11.1.1`), `ajv` (`^8.18.0`), and `cookie` (`^0.7.0`, used by Remix's cookie session); add `SECURITY.md` documenting the dependency posture and triage for the remaining deferred alerts ([#68](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/68)).
- Patch `shell-quote` and `ws` via version-scoped npm `overrides`; refresh the `SECURITY.md` triage ([#75](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/75)).

## [2.0.0] - 2026-06-04

> Major release: the substantial `@myst-theme` 0.14 → 1.x upgrade, a technical-review
> pass, and a modernised release/test setup (Phase 0). It is a **major** bump because
> it carries backwards-incompatible changes for consumers: `@myst-theme` v1.0.0's new
> notebook output-node AST (content built with an older `mystmd` may not render
> correctly) and a raised runtime requirement (Node `>=14` → `>=20`). The previously
> deployed bundle (`QuantEcon/quantecon-theme`) was **v1.1.1** and predates everything
> below; a `make deploy` ships it.
>
> The three "Fixed" items marked **(1.x regression)** are bugs the upgrade itself
> introduced. They never reached users — they were caught pre-release by validating the
> build against the visual-regression harness and real `lecture-wasm` content before
> deploying.

### Changed
- Upgrade all `@myst-theme/*` packages from `0.14.x` to `1.3.0`, and `myst-common`/`myst-config` to `1.9.5`, tracking current upstream [`myst-theme/book`](https://github.com/jupyter-book/myst-theme/tree/main/themes/book) ([#30](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/30) brought 0.14→1.1.2; later bumped to 1.3.0 to match latest upstream). **Upstream breaking change:** `@myst-theme` v1.0.0 introduced a new AST structure for notebook output nodes ([jupyter-book/myst-theme#571](https://github.com/jupyter-book/myst-theme/pull/571)).
- Raise the Node engine floor from `>=14` to `>=20` (drops EOL Node 18) and move local/CI tooling to **Node 24** (`.nvmrc` + CI + release workflow), matching upstream's build; bump release-workflow actions v3 → v4 ([#31](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/31)).

### Added
- Playwright visual-regression harness: renders a small fixture project (plain Markdown + a notebook) through a live `myst start` against a chosen theme version and snapshots each surface, so styling/markup regressions across the upgrade are caught before deploy ([#60](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/60)).
- CI workflow (`.github/workflows/ci.yml`) running type-check (`npm run compile`) and a production build (`npm run prod:build`) on every push/PR to `main` ([#31](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/31)).
- `CONTRIBUTING.md` documenting development setup, available scripts, project structure, commit conventions, and the release process ([#31](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/31)).

### Fixed
- **(1.x regression)** Every page returned HTTP 500 under `@myst-theme` 1.x (`useBannerState must be used from within a BannerStateProvider`). Wrap the page tree (article **and** error page) in `BannerStateProvider` so the new `useBannerState`/`useSidebarHeight` hooks resolve ([#61](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/61)).
- **(1.x regression)** The article body rendered full-bleed (flush-left, no centered content column, right-hand "On this page" margin swallowed). `@myst-theme` 1.x emits `.col-screen` in a later cascade layer than our base-layer centering rule, so the body's `col-screen` wrapper won; drop it so blocks fall back to the centered `col-body` default (matching upstream's `myst-content-blocks` pattern) ([#62](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/62)).
- **(1.x regression)** Pages flashed continuously (a hard-reload loop) and the in-page "On this page" outline never rendered. Keep `@remix-run/*` pinned to `~1.17.0` (restoring the long-standing v1.0.1 pin; reverting the [#29](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/29) bump to 1.19) — Remix 1.19's client calls `window.location.reload()` whenever `window.__remixContext.url` is undefined, which it always is under the mystmd CLI's SSR. Adds `.npmrc` `legacy-peer-deps=true` and an explicit `typescript` devDependency so installs accept `@myst-theme/site`'s stricter `^1.19` peer range ([#63](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/63)).
- `aria-label` typo (`aira-label`) in `ProjectFrontmatter.tsx` — the authors section is now exposed to screen readers ([#31](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/31)).
- Missing React `key` prop on author `<span>` elements built in a `.reduce()` in `ProjectFrontmatter.tsx` ([#31](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/31)).
- Swapped `SidebarToggle.tsx` ARIA labels so each matches its visible icon state ("Show"/"Hide table of contents") ([#31](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/31)).
- TypeScript errors surfaced by the new CI: add `@types/lodash.throttle`; wrap `Buffer` in `new Uint8Array(...)` for the `Response` body in the `[objects.inv]` and `[favicon.ico]` routes ([#32](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/32)).

### Security
- Add `overrides` for `prismjs` (`^1.30.0`, GHSA-x7hr-w5r2-h6wg DOM-clobbering) and `katex` (`^0.16.21`, five CVEs), resolving those advisories ([#29](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/29), [#30](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/30)). The remaining `npm audit` findings live in the older Remix v1 build toolchain (esbuild/webpack and friends); pinning `@remix-run/*` back to `~1.17.0` for rendering correctness (see Fixed, [#63](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/63)) keeps those present until the Remix v2 migration ([#28](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/28)).

### Dependencies
- Numerous Dependabot security updates merged, including `webpack`, `vite`, `vm2`, `tar-fs`, `lodash`/`lodash-es`, `qs`/`express`, `js-yaml`, `form-data`, `brace-expansion`, `@babel/*`, `diff`, and `minimatch`.

## [1.1.1] - 2025-06-13
> Deployed to the bundle repo on 2025-06-13. The source version-bump PR
> ([#8](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/8)) was merged much later,
> on 2026-02-25, as bookkeeping — it did not change what users were running.

### Fixed
- Strip the `.myst` suffix from the derived `org/repo` when building Colab / JupyterHub launch URLs, so lecture repos named `lecture-*.myst` produce working notebook links (`6e39113`, [#4](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/4)).

### Removed
- Dropped the no-longer-needed `@types/react-syntax-highlighter` patch ([#8](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/8)).

## [1.1.0] - 2025-02-28

### Changed
- Update `@myst-theme/*` to `0.14.0` (`df3bcd4`, [#2](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/2)).

## [1.0.6] - 2025-02-18

### Changed
- Update the margin Outline ("On this page") text (`9071f34`).

## [1.0.5] - 2025-02-17

### Changed
- Use `useLinkProvider` for internal links instead of constructing them directly (`dd76b21`).

## [1.0.4] - 2025-02-17

### Fixed
- Fix a missing slash in generated links (`26772b0`).

## [1.0.3] - 2025-02-17

### Fixed
- Fix Home, Contents, and ProjectHeader link targets (`c0369e8`).

## [1.0.2] - 2025-02-17

### Fixed
- Fix `baseurl` handling in the toolbar and outline links (`73c72f2`).

## [1.0.1] - 2025-02-17

### Changed
- Pin to `remix@1.17` for compatibility (`8066c00`).

## [1.0.0] - 2025-02-14

### Added
- Initial version of the QuantEcon MyST theme: Remix + `@myst-theme` book theme with QuantEcon branding, toolbar (home, search, fullscreen, font scaling, dark mode, downloads, Colab/JupyterHub launch, edit-on-GitHub), content-driven site footer, and bundled brand assets.

[Unreleased]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v2.3.1...HEAD
[2.3.1]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.1.1...v2.0.0
[1.1.1]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/QuantEcon/quantecon-theme.mystmd/releases/tag/v1.0.0
