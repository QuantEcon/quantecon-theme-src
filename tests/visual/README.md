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
- `npx playwright install --with-deps chromium` (browser binaries)

## Selecting the theme: `THEME_TEMPLATE`

`serve.sh` injects `THEME_TEMPLATE` as the fixture's `site.template`. It accepts
either a local theme **build directory** or a GitHub **archive zip URL**.

| Target | `THEME_TEMPLATE` |
| ------ | ---------------- |
| **v1.1.1 (last release / baseline)** | `https://github.com/QuantEcon/quantecon-theme/archive/refs/heads/main.zip` *(the deployed bundle is still v1.1.1)* |
| **2.0.0 candidate (this repo)** | a local build dir — `make build-theme` then `$PWD/.deploy/quantecon-theme` |

## Validate the 2.0.0 move (before / after)

```bash
# 1. Capture the v1.1.1 baseline snapshots
THEME_TEMPLATE="https://github.com/QuantEcon/quantecon-theme/archive/refs/heads/main.zip" \
  npm run test:visual:update

# 2. Build the 2.0.0 candidate and diff against the baseline
make build-theme
THEME_TEMPLATE="$PWD/.deploy/quantecon-theme" \
  npm run test:visual
```

Any diffs reported in step 2 are exactly what the `@myst-theme` 0.14→1.3.0
upgrade (+ Node 24) changed. Review `playwright-report/` and update baselines
with `npm run test:visual:update` once changes are confirmed intentional.

## Files

- `fixture/` — minimal MyST project (`intro.md`, `features.md`, `notebook.ipynb`)
- `fixture/myst.yml.in` — template; `serve.sh` writes `myst.yml` from it
- `serve.sh` — `myst start` with the chosen `THEME_TEMPLATE`
- `theme.spec.ts` — one full-page snapshot per surface
- `__snapshots__/` — committed baselines

> The generated `fixture/myst.yml`, `fixture/_build/`, and `playwright-report/`
> are gitignored.
