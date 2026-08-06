# Security

## Reporting a vulnerability

Please report security issues privately via GitHub's
["Report a vulnerability"](https://github.com/QuantEcon/quantecon-theme.mystmd/security/advisories/new)
flow rather than opening a public issue.

## Dependency security posture

This theme is **deliberately pinned to Remix v1.17** (`@remix-run/*` `~1.17.0`).
Remix 1.19+ hard-reloads the client when `window.__remixContext.url` is
undefined — which it always is under the mystmd CLI's SSR — producing an
infinite reload loop and breaking the in-page outline (see
[#63](https://github.com/QuantEcon/quantecon-theme.mystmd/pull/63) and the comment
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
| `shell-quote` | `^1.10.0` | GHSA-w7jw-789q-3m8p (dev; via `concurrently`)        |
| `ws@^8.0.0` | `^8.20.1`  | GHSA-58qx-3vcg-4xpx — scoped to the 8.x copies (Jupyter/jsdom test chain) so the deferred `ws@7` (thebe) is untouched |
| `brace-expansion@^1.0.0` | `^1.1.18` | GHSA-3jxr-9vmj-r5cp / GHSA-mh99-v99m-4gvg / GHSA-rgw5-rvv9-x895 — ReDoS-style DoS via exponential expansion; two majors coexist in the tree, so the override is version-scoped like `ws` |
| `brace-expansion@^5.0.0` | `^5.0.7`  | same advisories, 5.x copy (dev chain)  |
| `js-yaml@^3.0.0` | `^3.15.0` | GHSA-52cp-r559-cp3m / GHSA-h67p-54hq-rp68 — quadratic CPU consumption via YAML merge-key chains |
| `js-yaml@^4.0.0` | `^4.3.0`  | same advisories, 4.x copy              |
| `sanitize-html` | `^2.17.5` | GHSA-vccv-cmxp-4j9h — incomplete URI-scheme validation |
| `@babel/core` | `^7.29.6` | GHSA-4x5r-pxfx-6jf8 — arbitrary file read via `sourceMappingURL` comment (low; build-time) |

`npm audit fix` (without `--force`) is a **no-op** for this tree: every
remaining advisory needs either a major bump or a manual override.

## Triage of open Dependabot alerts

Snapshot as of **2026-08-06**, re-triaged against the full open alert set (not
just the Remix ones). Re-evaluate when the theme migrates off Remix v1.

Every open alert is accounted for below or was closed by an override in the
table above. When adding a deferral here, name the **package** — the buckets are
matched by package, so an advisory whose package appears nowhere in this section
is an untriaged one, not an implicitly-deferred one.

### Deferred — patched only in Remix v2 (intentionally not adopted)

| Package(s)                                                              | Severity | Status                                                                                                  |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `@remix-run/node` (GHSA-9583-h5hc-x8cw / CVE-2025-61686)               | critical | **Not applicable** — path traversal in *file*-backed session storage (`createFileSessionStorage`), which this theme does not use. The theme's only session is the cookie-backed color-mode session (`createCookieSessionStorage`, via `@myst-theme/site`'s `getThemeSession` in `app/root.tsx`). |
| `@remix-run/react`, `@remix-run/server-runtime`, `@remix-run/router`, `react-router` | high/med | Patched only in Remix v2 / react-router 6.30+ (incl. GHSA-2j2x-hqr9-3h42, the `//` protocol-relative open redirect fixed in 6.30.4). `@remix-run/react@1.17` exact-pins `react-router-dom@6.13.0` + `@remix-run/router@1.6.3`, which ship paired internal APIs, so the routers can't be pulled forward independently. Deferred with the v1 pin. |

### No upstream fix available

| Package | Severity | Status                                                       |
| ------- | -------- | ------------------------------------------------------------ |
| `ip`    | high     | Unmaintained; no patched release exists. Dev/transitive only. |

### Deferred — major bump in the MyST / Thebe build chain

These are transitive dev-/build-time dependencies (or bundled into the static
Thebe assets in `public/`). Their fixes are major-version bumps with a high
regression risk for the toolchain and low real exposure for the deployed site,
so they are deferred until the relevant upstream (`mystmd`, `thebe`, Remix)
ships them: `markdown-it` (13→14 — this also carries `linkify-it` 4→5, whose
GHSA-22p9-wv53-3rq4 / GHSA-v245-v573-v5vm quadratic-complexity advisories have
no 4.x fix; `linkify-it` reaches the tree only as a `markdown-it` dependency, so
it moves when `markdown-it` does), `nanoid` (4→5), `ws` (7→8), `tar` (6→7,
covers the 2026 node-tar path-traversal batch GHSA-8qq5-rm4j-mr97 /
GHSA-r6q2-hw4h-h46w / GHSA-34x7-hfp2-rc4v / GHSA-83g3-92jg-28cx /
GHSA-qffp-2rhf-9h96 / GHSA-9ppj-qmqm-q256 — all fixed only in 7.5.x),
`vite` (5→6, incl. GHSA-4w7w-66w2-5vf9), `esbuild` (0.17→0.25),
`estree-util-value-to-estree` (1→3), `yaml`, and `@tootallnate/once` (1→2,
low; nested under `@remix-run/dev`'s proxy-agent chain — the top-level copy
is already 2.0.1).
