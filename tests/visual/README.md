# Visual regression tests

Playwright snapshot tests for the QuantEcon MyST theme, modelled on
`quantecon-book-theme`'s setup but adapted for this theme's **runtime** nature:
the tests render a small fixture project (`fixture/`) through a live `myst start`
server, with the **theme under test** chosen at run time.

## Why

The theme is consumed by lectures as a built bundle. To catch styling/markup
regressions (especially the `@myst-theme` v1.0.0 notebook output-node AST change),
we screenshot the same content rendered by different theme versions and diff.

## Prerequisites

- Node 24 (`.nvmrc`) and the `mystmd` CLI (`myst`) on `PATH`
- `npm ci` (installs `@playwright/test`)
- `npx playwright install --with-deps chromium webkit` (browser binaries —
  `chromium` for the visual snapshots, `webkit` for the FOUC guard below)

## Selecting the theme: `THEME_TEMPLATE`

`serve.sh` injects `THEME_TEMPLATE` as the fixture's `site.template`. It accepts
either a local theme **build directory** or a GitHub **archive zip URL**.

| Target | `THEME_TEMPLATE` |
| ------ | ---------------- |
| **This repo (current candidate)** | a local build dir — `make build-theme` then `$PWD/.deploy/quantecon-theme` |
| **The live deployed bundle** | the build repo's `main` archive (moving HEAD = whatever is currently deployed) — `https://github.com/QuantEcon/quantecon-theme/archive/refs/heads/main.zip` |

The committed `__snapshots__/` baselines are **v2.0.0** — the first release of the
`@myst-theme` 1.x theme — captured from a local build.

## Validate a change

```bash
# Build the candidate and diff it against the committed baselines
make build-theme
THEME_TEMPLATE="$PWD/.deploy/quantecon-theme" \
  npm run test:visual
```

Any diffs are what your change altered. Review `playwright-report/`; once the
changes are confirmed intentional, refresh the baselines:

```bash
THEME_TEMPLATE="$PWD/.deploy/quantecon-theme" \
  npm run test:visual:update
```

> The baselines were first captured against the deployed **v1.1.1** bundle to validate
> the `@myst-theme` 0.14 → 1.x upgrade, then re-based to **v2.0.0** once that upgrade
> shipped. To compare against any released bundle, point `THEME_TEMPLATE` at its
> archive zip.

## FOUC guard (WebKit)

`fouc.spec.ts` guards the Safari/WebKit flash-of-unstyled-content fix
([#66](https://github.com/QuantEcon/quantecon-theme-src/issues/66)): it aborts
all external stylesheets so the only styling that can reach the first paint is
the inline critical CSS in `app/root.tsx`, then asserts the layout/font are
already correct (and a control case proves the abort really strips styling).
It is **snapshot-free** (asserts computed `display`/`font-family`, not pixels),
so it is robust across `myst`/CI versions. It runs on the `webkit-fouc` project
only — Chromium paint-holds and cannot exhibit the flash — and is wired into CI
as the `FOUC guard (WebKit)` job.

```bash
make build-theme
THEME_TEMPLATE="$PWD/.deploy/quantecon-theme" \
  npm run test:fouc
```

## Files

- `fixture/` — minimal MyST project (`intro.md`, `features.md`, `notebook.ipynb`)
- `fixture/myst.yml.in` — template; `serve.sh` writes `myst.yml` from it
- `serve.sh` — `myst start` with the chosen `THEME_TEMPLATE`
- `theme.spec.ts` — one full-page snapshot per surface (Chromium)
- `fouc.spec.ts` — FOUC guard, no snapshots (WebKit)
- `__snapshots__/` — committed baselines

> The generated `fixture/myst.yml`, `fixture/_build/`, and `playwright-report/`
> are gitignored.
