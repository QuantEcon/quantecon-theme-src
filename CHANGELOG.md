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
> [`QuantEcon/quantecon-theme`](https://github.com/QuantEcon/quantecon-theme), which
> stays updated via `make deploy` only until consumers move to pinned release URLs
> (see Phase 0 in [`PLAN.md`](./PLAN.md)).

## [Unreleased]

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

[Unreleased]: https://github.com/QuantEcon/quantecon-theme.mystmd/compare/v2.1.0...HEAD
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
