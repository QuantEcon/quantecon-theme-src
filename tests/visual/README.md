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
| **This repo (current candidate)** | a local build dir — `make build-theme` then `$PWD/.deploy/quantecon-theme` |
| **A deployed release** | its archive zip, e.g. `https://github.com/QuantEcon/quantecon-theme/archive/refs/heads/main.zip` |

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

## Files

- `fixture/` — minimal MyST project (`intro.md`, `features.md`, `notebook.ipynb`)
- `fixture/myst.yml.in` — template; `serve.sh` writes `myst.yml` from it
- `serve.sh` — `myst start` with the chosen `THEME_TEMPLATE`
- `theme.spec.ts` — one full-page snapshot per surface
- `__snapshots__/` — committed baselines

> The generated `fixture/myst.yml`, `fixture/_build/`, and `playwright-report/`
> are gitignored.
