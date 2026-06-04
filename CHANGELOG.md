# Changelog

All notable changes to `@curvenote/quantecon-book` (the QuantEcon MyST theme) are
documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Release flow.** This theme is developed here in `quantecon-theme-src` and
> deployed (bundled) to [`QuantEcon/quantecon-theme`](https://github.com/QuantEcon/quantecon-theme)
> via `make deploy`. The deploy step copies this file into the bundled repo, so this
> is the canonical changelog. The version comes from `package.json`; each release is a
> deploy commit (`🚀 vX.Y.Z from <sha>`) in the bundled repo. There are currently no
> git tags (see Phase 0 in [`PLAN.md`](./PLAN.md)).

## [Unreleased]

> Proposed release: **2.0.0** (major). This is the substantial `@myst-theme` 0.14 → 1.x
> upgrade plus a technical-review pass. It is a **major** bump because it carries
> backwards-incompatible changes for consumers: `@myst-theme` v1.0.0's new notebook
> output-node AST (content built with an older `mystmd` may not render correctly) and a
> raised runtime requirement (Node `>=14` → `>=18`). The currently deployed bundle
> (`QuantEcon/quantecon-theme`) is still **v1.1.1** and predates all of the changes below
> — a `make deploy` is required to ship them.

### Changed
- Upgrade all `@myst-theme/*` packages from `0.14.x` to `1.3.0`, and `myst-common`/`myst-config` to `1.9.5`, tracking current upstream [`myst-theme/book`](https://github.com/jupyter-book/myst-theme/tree/main/themes/book) ([#30](https://github.com/QuantEcon/quantecon-theme-src/pull/30) brought 0.14→1.1.2; later bumped to 1.3.0 to match latest upstream). **Upstream breaking change:** `@myst-theme` v1.0.0 introduced a new AST structure for notebook output nodes ([jupyter-book/myst-theme#571](https://github.com/jupyter-book/myst-theme/pull/571)).
- Bump all six `@remix-run/*` packages from `~1.17.0` to `~1.19.0` (still Remix v1) to resolve an `ERESOLVE` peer-dependency conflict with `@myst-theme/site` ([#29](https://github.com/QuantEcon/quantecon-theme-src/pull/29)).
- Raise the Node engine floor from `>=14` to `>=20` (drops EOL Node 18) and move local/CI tooling to **Node 24** (`.nvmrc` + CI + release workflow), matching upstream's build; bump release-workflow actions v3 → v4 ([#31](https://github.com/QuantEcon/quantecon-theme-src/pull/31)).

### Added
- CI workflow (`.github/workflows/ci.yml`) running type-check (`npm run compile`) and a production build (`npm run prod:build`) on every push/PR to `main` ([#31](https://github.com/QuantEcon/quantecon-theme-src/pull/31)).
- `CONTRIBUTING.md` documenting development setup, available scripts, project structure, commit conventions, and the release process ([#31](https://github.com/QuantEcon/quantecon-theme-src/pull/31)).

### Fixed
- `aria-label` typo (`aira-label`) in `ProjectFrontmatter.tsx` — the authors section is now exposed to screen readers ([#31](https://github.com/QuantEcon/quantecon-theme-src/pull/31)).
- Missing React `key` prop on author `<span>` elements built in a `.reduce()` in `ProjectFrontmatter.tsx` ([#31](https://github.com/QuantEcon/quantecon-theme-src/pull/31)).
- Swapped `SidebarToggle.tsx` ARIA labels so each matches its visible icon state ("Show"/"Hide table of contents") ([#31](https://github.com/QuantEcon/quantecon-theme-src/pull/31)).
- TypeScript errors surfaced by the new CI: add `@types/lodash.throttle`; wrap `Buffer` in `new Uint8Array(...)` for the `Response` body in the `[objects.inv]` and `[favicon.ico]` routes ([#32](https://github.com/QuantEcon/quantecon-theme-src/pull/32)).

### Security
- Reduced `npm audit` findings from **60 → 34** across [#29](https://github.com/QuantEcon/quantecon-theme-src/pull/29) and [#30](https://github.com/QuantEcon/quantecon-theme-src/pull/30): `prismjs` DOM-clobbering (GHSA-x7hr-w5r2-h6wg), five KaTeX CVEs, and the dompurify/mermaid chain. Added `overrides` for `prismjs` (`^1.30.0`) and `katex` (`^0.16.21`). The remaining findings require the Remix v2 migration ([#28](https://github.com/QuantEcon/quantecon-theme-src/issues/28)) and upstream `@myst-theme` fixes.

### Dependencies
- Numerous Dependabot updates merged, including `webpack`, `vite`, `vm2`, `tar-fs`, `lodash`/`lodash-es`, `qs`/`express`, `js-yaml`, `form-data`, `brace-expansion`, `@babel/*`, `diff`, and `minimatch`.

## [1.1.1] - 2025-06-13
> Deployed to the bundle repo on 2025-06-13. The source version-bump PR
> ([#8](https://github.com/QuantEcon/quantecon-theme-src/pull/8)) was merged much later,
> on 2026-02-25, as bookkeeping — it did not change what users were running.

### Fixed
- Strip the `.myst` suffix from the derived `org/repo` when building Colab / JupyterHub launch URLs, so lecture repos named `lecture-*.myst` produce working notebook links (`6e39113`, [#4](https://github.com/QuantEcon/quantecon-theme-src/pull/4)).

### Removed
- Dropped the no-longer-needed `@types/react-syntax-highlighter` patch ([#8](https://github.com/QuantEcon/quantecon-theme-src/pull/8)).

## [1.1.0] - 2025-02-28

### Changed
- Update `@myst-theme/*` to `0.14.0` (`df3bcd4`, [#2](https://github.com/QuantEcon/quantecon-theme-src/pull/2)).

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

[Unreleased]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/QuantEcon/quantecon-theme-src/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/QuantEcon/quantecon-theme-src/releases/tag/v1.0.0
