# Security

## Reporting a vulnerability

Please report security issues privately via GitHub's
["Report a vulnerability"](https://github.com/QuantEcon/quantecon-theme-src/security/advisories/new)
flow rather than opening a public issue.

## Dependency security posture

This theme is **deliberately pinned to Remix v1.17** (`@remix-run/*` `~1.17.0`).
Remix 1.19+ hard-reloads the client when `window.__remixContext.url` is
undefined — which it always is under the mystmd CLI's SSR — producing an
infinite reload loop and breaking the in-page outline (see
[#63](https://github.com/QuantEcon/quantecon-theme-src/pull/63) and the comment
block in [`.npmrc`](.npmrc)). Most upstream Remix security advisories are
patched only in the **v2** line, so they cannot be resolved without a major
migration that re-introduces that regression. This is a conscious trade-off and
is tracked below.

Where a vulnerable **transitive** dependency has a backward-compatible patched
release, we pull it forward with an [`overrides`](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#overrides)
entry in [`package.json`](package.json) rather than bumping a major version of
the toolchain. Current overrides:

| Package    | Forced to   | Reason                                   |
| ---------- | ----------- | ---------------------------------------- |
| `prismjs`  | `^1.30.0`   | ReDoS / prototype-pollution advisories   |
| `katex`    | `^0.16.21`  | matches the rendered KaTeX (vs CDN 0.15) |
| `uuid`     | `^11.1.1`   | GHSA-w5hq-g745-h8pq                       |
| `ajv`      | `^8.18.0`   | GHSA-2g4f-4pwh-qvx6                       |
| `cookie`   | `^0.7.0`    | GHSA-pxg6-pf52-xh8x (used via Remix's cookie session) |

`npm audit fix` (without `--force`) is a **no-op** for this tree: every
remaining advisory needs either a major bump or a manual override.

## Triage of open Dependabot alerts

Snapshot as of **2026-06-04**. Re-evaluate when the theme migrates off Remix v1.

### Deferred — patched only in Remix v2 (intentionally not adopted)

| Package(s)                                                              | Severity | Status                                                                                                  |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `@remix-run/node` (GHSA-9583-h5hc-x8cw)                                | critical | **Not applicable** — path traversal in *file*-backed session storage (`createFileSessionStorage`), which this theme does not use. The theme's only session is the cookie-backed color-mode session (`createCookieSessionStorage`, via `@myst-theme/site`'s `getThemeSession` in `app/root.tsx`). |
| `@remix-run/react`, `@remix-run/server-runtime`, `@remix-run/router`, `react-router` | high/med | Patched only in Remix v2 / react-router 6.30+. Deferred with the v1 pin.                                 |

### No upstream fix available

| Package | Severity | Status                                                       |
| ------- | -------- | ------------------------------------------------------------ |
| `ip`    | high     | Unmaintained; no patched release exists. Dev/transitive only. |

### Deferred — major bump in the MyST / Thebe build chain

These are transitive dev-/build-time dependencies (or bundled into the static
Thebe assets in `public/`). Their fixes are major-version bumps with a high
regression risk for the toolchain and low real exposure for the deployed site,
so they are deferred until the relevant upstream (`mystmd`, `thebe`) ships them:
`markdown-it` (13→14), `nanoid` (4→5), `ws` (7→8), `tar` (6→7), `vite` (5→6),
`esbuild` (0.17→0.25), `estree-util-value-to-estree` (1→3), `yaml`.
