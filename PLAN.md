# PLAN — QuantEcon MyST theme feature parity with `quantecon-book-theme`

This plan tracks bringing the MyST theme (this repo, `quantecon-theme-src`, bundled
to [`QuantEcon/quantecon-theme`](https://github.com/QuantEcon/quantecon-theme)) to
feature parity with the Sphinx / Jupyter-Book&lt;2 theme
[`quantecon-book-theme`](https://github.com/QuantEcon/quantecon-book-theme) ahead of
migrating the QuantEcon lectures to MyST (Jupyter Book ≥ 2).

## Context & the one architectural constraint that shapes everything

The two themes run in fundamentally different environments:

| | `quantecon-book-theme` (Sphinx) | `quantecon-theme-src` (MyST) |
| --- | --- | --- |
| Runs | At **build time**, inside the lecture repo | As a **runtime Remix server** consuming pre-built content JSON from the MyST content CDN |
| Has the git repo? | **Yes** — can shell out to `git` | **No** — only sees per-page `mdast` + `frontmatter` JSON |
| Customised via | Jinja templates + a Sphinx extension (`__init__.py`) | React/TSX components + `myst.yml` config |

**Consequence:** any feature that derives from the source repo at build time (git
history, last-modified dates, computed launch paths) **cannot be computed by the
theme**. It must be injected into the page `frontmatter`/data upstream — either by:

- **(A) a MyST plugin / transform** that runs during `myst build` in the lecture repo
  and writes the data into each page's frontmatter, or
- **(B) built-in `mystmd` support** (where it already exists — e.g. frontmatter
  `date`), or
- **(C) a CI step** (GitHub Action) that pre-computes the data and feeds it in.

The theme component's job is then only to *render* `page.frontmatter.<field>`. This
split is called out per phase below. Several phases therefore have an "upstream"
deliverable in addition to the theme change.

A second cross-cutting consideration: this theme tracks the upstream
[`jupyter-book/myst-theme`](https://github.com/jupyter-book/myst-theme) `book` theme.
Before building anything custom, **check whether the feature already exists upstream**
(or could be contributed upstream rather than forked into QuantEcon-only code).

---

## Feature gap summary

Derived from `quantecon-book-theme` v0.20.3 (see its `README.md`, `docs/user/*`, and
`src/quantecon_book_theme/`).

| # | Feature | Book-theme | MyST theme | Phase |
| --- | --- | :---: | :---: | :---: |
| Git history in lecture headers (last-modified + changelog dropdown) | ✅ | ❌ | **1** |
| Launch parity — BinderHub + Thebe (live compute) in addition to Colab / private hub | ✅ | ⚠️ partial | **2** |
| Configurable code highlighting (custom QE tokens vs Pygments styles) | ✅ | ❌ | **3** |
| Text colour schemes (`seoul256` / `gruvbox` / `none` + custom) | ✅ | ❌ | **3** |
| Language switcher (multilingual) + `hreflang` SEO tags | ✅ | ❌ | **4** |
| RTL support (`dir="rtl"`) | ✅ | ❌ | **5** |
| Collapsible stderr warnings in notebook cells | ✅ | ❓ verify | **6** |
| Full OpenGraph / Twitter card meta tags | ✅ | ⚠️ partial | **6** |
| **Already at parity:** dark mode, font scaling, fullscreen, search, "On this page" TOC + back-to-top, contents sidebar, downloads (PDF/notebook), Colab + private JupyterHub launch, edit-on-GitHub, author header, content-driven footer, responsive/mobile | ✅ | ✅ | — |

---

## Phase 0 — Modernise the release & distribution setup (prerequisite groundwork)

**Why first:** the deployed bundle is stuck at v1.1.1 (June 2025) and predates the
entire `@myst-theme` 1.x upgrade. Parity work is meaningless until what's in `main` is
shipped *and* the release loop is trustworthy. This also uses the pre-cutover window —
while ~no lecture references the theme yet — to fix the repo architecture cheaply.

**Decision — collapse to a single repo that distributes GitHub Release zips.** Today the
theme is a two-repo split: source here is built by `make deploy` and pushed to a separate
build repo (`QuantEcon/quantecon-theme`), whose `main`-branch zip lectures download. That
split is inherited from upstream (`jupyter-book/myst-theme` → `myst-templates/book-theme`),
where it exists because upstream is a *monorepo producing many products* (npm packages +
the book & article themes) feeding a *named public registry* — **neither applies to us**
(one theme, consumed by direct URL). Upstream is itself moving off it: their
`theme-assets.yml` ships built theme zips as **GitHub Release assets** "rather than pushing
to the myst-templates/*-theme repos … a step toward using GitHub releases instead"
(jupyter-book/myst-enhancement-proposals#34). So a single repo + release zips tracks where
upstream is heading.

**Target architecture:**
- **One repo**, renamed **`quantecon-theme.mystmd`** (the `.mystmd` suffix marks it as
  `mystmd` tooling/renderer, distinct from content. Note: we deliberately do *not* reuse
  the lectures' `.myst` suffix — that was a transitional RST→MyST marker now being retired
  org-wide.)
- Each release is a `vX.Y.Z` **git tag** + **GitHub Release** with a built **theme zip**
  attached.
- Lectures set `site.template` to a **direct GitHub zip URL** for a pinned release.
- **Deliberate simplification (the caveat):** because lectures consume a *direct URL*, we
  do **not** need the MyST template **registry** or any `myst-cli` template-resolution
  support — those are exactly the parts of the upstream setup we skip. Build a zip, attach
  it to a release, point the URL at it.

**Repo consolidation & rename:**
- [ ] Rename `quantecon-theme-src` → **`quantecon-theme.mystmd`** (GitHub 301-redirects the
      old URLs; update the local `origin` remote).
- [ ] Once releases are live, **archive** the old build repo `QuantEcon/quantecon-theme`
      with a README note pointing to the new repo + release assets; do not reuse the name.
- [ ] Retire the `make deploy` / `build-theme` / `deploy-theme` Makefile targets (replaced
      by the release workflow); keep a local `make build-zip` for testing the artifact.

**Release pipeline (adapt upstream `theme-assets.yml`):**
- [ ] Add a workflow that, on a `vX.Y.Z` tag, builds (`npm run prod:build`), assembles the
      bundle (`build/ public/ template.yml server.js package.json` with `template`→name and
      `VERSION` substituted, plus `package-lock.json`, **excluding** `node_modules`), zips it,
      and attaches it to the GitHub Release for that tag. Upstream's `theme-assets.yml` is a
      near-verbatim reference — drop its `for THEME in book article` loop (one theme).
- [ ] Verify `myst start` resolves `site.template: <release-asset-url>` once (a release zip
      is just an HTTPS zip — the same mechanism today's `heads/main.zip` uses — so low risk).

**Versioning & changelog:**
- [ ] Make `vX.Y.Z` **tags** the release trigger; tag existing releases retroactively at
      their source commits (recorded in the old build repo as `🚀 vX.Y.Z from <sha>`) so the
      `CHANGELOG.md` footer compare/release links resolve.
- [ ] Resolve the Changesets ↔ Keep-a-Changelog tension, now that release = tag: either
      **(a)** drop Changesets and bump/tag manually with the hand-maintained Keep a Changelog
      (simplest for one theme — recommended), or **(b)** keep Changesets for the version bump
      + release automation but stop it owning `CHANGELOG.md` (`"changelog": false` in
      `.changeset/config.json`). Document the choice in `CONTRIBUTING.md`.
- [ ] Fold the `template.yml` `version` bump (stale at `1.0.0`) into the release step so it
      can no longer drift from `package.json`.

**Cut 1.2.0 (first release on the new flow):**
- [ ] Bump `package.json` to **1.2.0** (the `@myst-theme` 1.1.2 upgrade + technical-review
      fixes), tag `v1.2.0`, and let the pipeline publish the release zip — moving consumers
      off v1.1.1 at last.
- [ ] *Sequencing:* if unsticking v1.1.1 is urgent, a one-off `make deploy` could ship 1.2.0
      to the old build repo first — but that's throwaway since the repo is being retired.
      Recommended: land the pipeline first and make 1.2.0 its first release.

**Hygiene carried over:**
- [ ] Fix naming/branding drift: reconcile the package name (`@curvenote/quantecon-book` vs
      `@curvenote-themes/quantecon-theme`) and `template.yml` `title`/`source` against the new
      repo name.
- [ ] De-duplicate the two "Development" sections in `README.md` and update the Usage URL to
      the pinned-release form.
- [ ] Triage the ~20 open Dependabot PRs; schedule the Remix v2 migration ([#28]) that
      unblocks the remaining `npm audit` findings.
- [ ] Stand up a **visual preview / smoke test** against a real lecture repo (the book-theme
      uses `quantecon-book-theme-fixtures` + Playwright + Netlify previews — a lighter MyST
      equivalent would de-risk every later phase).

**Open decisions:** (1) Changesets vs. manual versioning; (2) consumer URL policy — pinned
`…/releases/download/vX.Y.Z/quantecon-theme.zip` per lecture (reproducible — recommended) vs.
rolling `…/releases/latest/download/…` (one stable URL, no pinning); (3) sequencing of the
1.2.0 cut.

**Effort:** M (pipeline + rename + consumer migration). **Risk:** low–medium (one-time
release-flow change; upstream reference implementation exists). **Deps:** none — best done
now, pre-cutover, while nothing points at the theme.

---

## Phase 1 — Git history in lecture headers ⭐ (flagship)

**Goal:** reproduce the book-theme's page header: a "Last changed: &lt;date&gt;" control
that expands a changelog dropdown of the last N commits, with clickable commit hashes
and a "full history" link.
**Reference:** `quantecon-book-theme/src/quantecon_book_theme/__init__.py`
(`get_git_last_modified`, `get_git_changelog`, `get_relative_time`) +
`theme/.../layout.html` lines ~278–305 + `assets/scripts/page-header.js` +
`docs/user/git-metadata.md`.

**Upstream (build-time) deliverable — required:**
- [ ] Investigate existing `mystmd` support for last-modified / git metadata in
      frontmatter before writing anything custom.
- [ ] If absent, build a **MyST plugin** (option A) that, during `myst build`, runs
      `git log --follow` per source file and injects into frontmatter, e.g.
      `frontmatter.last_modified` (ISO + formatted) and
      `frontmatter.changelog: [{hash, author, date, relative_time, message}]`.
      Mirror the book-theme's git logic (timeouts, `--follow`, graceful no-git
      fallback, configurable `max_entries` and date format).
- [ ] Decide where the plugin lives (a shared `quantecon-myst-plugins` package reused
      across lecture repos is preferable to per-repo copies).

**Theme (render) deliverable:**
- [ ] New `app/components/PageHeaderHistory.tsx` (or fold into `ProjectFrontmatter.tsx`)
      that reads the injected frontmatter and renders the button + collapsible dropdown,
      with the QuantEcon blue accent, dark mode, keyboard (Esc to close), and ARIA
      matching the existing toolbar components. Use Radix (already a dependency) for the
      disclosure.
- [ ] Build commit/history URLs from the project `github` field (reuse the `.myst`-suffix
      handling already in `LaunchButton.tsx`).
- [ ] Graceful no-op when the frontmatter fields are absent.

**Effort:** M–L (plugin is the bulk). **Risk:** medium (new upstream component).
**Deps:** Phase 0 preview harness helps validate against a real repo.

---

## Phase 2 — Launch parity (BinderHub + Thebe)

**Goal:** match the book-theme's full launch matrix. Today `LaunchButton.tsx` offers
**Colab** + **private JupyterHub** only; the book-theme also offers **BinderHub** and
in-page **Thebe** live compute.
**Reference:** `quantecon-book-theme/src/quantecon_book_theme/launch.py` (Binder/Hub/
Colab URL construction, `notebook_interface`, `nb_path_to_notebooks`, `path_to_docs`
stripping) + `docs/user/launch.md`.

- [ ] **Thebe:** the bundle already ships Thebe assets and `@myst-theme/jupyter` is wired
      in (`PageContent.tsx` uses `ExecuteScopeProvider`, `NotebookToolbar`). Confirm/enable
      `myst.yml` `project.jupyter`/`thebe` config path and surface a "live compute" toggle
      consistent with the toolbar.
- [ ] **BinderHub:** add a Binder option to the `LaunchButton` radio group; build
      `…/v2/gh/{org}/{repo}/{branch}?urlpath=…` URLs.
- [ ] Generalise the hardcoded `.notebooks` suffix and `main` branch
      (`LaunchButton.tsx:9–11`) into config read from project frontmatter / `myst.yml`,
      so non-default branches and naming work.
- [ ] Verify Colab path handling for **nested** lecture dirs (book-theme strips
      `path_to_docs` and applies `nb_path_to_notebooks`; the MyST version currently uses
      only `page.location.split('.')[0]`).

**Effort:** M. **Risk:** low–medium. **Deps:** Phase 0.

---

## Phase 3 — Code highlighting + text colour schemes

Two related theming features; bundle together since both touch the CSS/token layer.

**Goal A — configurable code highlighting:** book-theme `qetheme_code_style` toggles
between custom QuantEcon token colours and any built-in Pygments style.
**Goal B — text colour schemes:** book-theme ships `seoul256` (default), `gruvbox`,
`none`, plus a `custom_color_scheme.css` hook, exposed as CSS variables
(`--qe-literal-color`, emphasis/strong/definition colours).
**Reference:** book-theme `__init__.py` (`add_pygments_style_class`,
`setup_pygments_css`, `validate_color_scheme`), `assets/styles/_color-schemes.scss` /
`_syntax.scss`, `docs/user/code-highlighting.md`, `docs/user/text-color-schemes.md`.

- [ ] Map the book-theme colour-scheme CSS variables onto this theme's Tailwind tokens
      (`qetext-*`, `qeborder-blue`, …) in `tailwind.config.js` / `styles/app.css`.
- [ ] Add a `myst.yml`-driven option to select scheme; render a body/root class
      (`color-scheme-gruvbox`, etc.) the same way the book-theme does.
- [ ] Decide code-highlighting strategy under MyST (syntax highlighting comes from
      `@myst-theme`/prism, not Pygments) — likely "QE token theme vs upstream default"
      rather than a literal Pygments port. Document the mapping.

**Effort:** M. **Risk:** medium (visual regressions — needs the Phase 0 preview).
**Deps:** Phase 0.

---

## Phase 4 — Internationalisation (language switcher + hreflang)

**Goal:** book-theme v0.20.0 globe-icon dropdown to switch between translated lecture
sites, plus `<link rel="alternate" hreflang>` head tags for SEO. Only renders with 2+
languages configured.
**Reference:** book-theme `_process_languages()` in `__init__.py`, `layout.html`
hreflang block + language-switcher markup, `assets/scripts/language-switcher.js`,
`assets/styles/_language-switcher.scss`, `docs/user/rtl-support.md`,
`docs/developer/multilingual.md` + `infrastructure.md`.

- [ ] Add a `languages` config (list of `{code, name, url}`) to `myst.yml`/site config,
      surfaced to the theme via the site manifest loader (`loaders.server.ts`).
- [ ] New toolbar `LanguageSwitcher.tsx` (Radix dropdown), placed consistently in
      `Toolbar.tsx` / `MobileActionsMenu.tsx`, with keyboard nav + active-language marker.
- [ ] Inject `hreflang` alternates in `root.tsx` `links`/`meta` for each language +
      `x-default`.

**Effort:** M. **Risk:** low. **Deps:** none (independent of 1–3).

---

## Phase 5 — RTL support

**Goal:** book-theme `enable_rtl` sets `dir="rtl"` on `<body>` and ships `_rtl.scss`.
**Reference:** book-theme `layout.html` `body_tag` block + `assets/styles/_rtl.scss` +
`docs/user/rtl-support.md`.

- [ ] Add a config flag; set `dir="rtl"` on the document in `root.tsx`.
- [ ] Audit Tailwind utilities for logical-property / RTL correctness (margins, the blue
      left/right accents, toolbar ordering); add RTL overrides where physical properties
      leak.

**Effort:** S–M. **Risk:** low. **Deps:** ideally after Phase 4 (often shipped together
for the same translated sites).

---

## Phase 6 — Meta/SEO + notebook-output polish

**Goal:** close the smaller gaps and verify assumptions.

- [ ] **OpenGraph/Twitter parity:** the book-theme emits a full OG + Twitter card set;
      `root.tsx` currently uses `getMetaTagsForSite` (title/description/twitter). Add
      `og:image`/`twitter:image` (logo), `og:type`, `og:site_name`, etc., driven from
      site config.
- [ ] **Collapsible stderr warnings:** confirm whether `@myst-theme/jupyter` already
      renders notebook stderr in a collapsible/styled way (it may — verify before
      porting). If not, add an output transform/renderer.
- [ ] **Docs:** add a `docs/`-style feature reference for the MyST theme mirroring the
      book-theme's `docs/user/*` set, so downstream lecture maintainers have parity
      documentation.

**Effort:** S–M. **Risk:** low. **Deps:** none.

---

## Sequencing & dependencies

```
Phase 0  (hygiene/deploy + preview harness)  ── prerequisite for everything
   │
   ├─▶ Phase 1  Git history in headers      ⭐ highest value, has an upstream plugin
   ├─▶ Phase 2  Launch parity (Binder/Thebe)
   ├─▶ Phase 3  Code highlight + colour schemes  (needs visual preview)
   ├─▶ Phase 4  i18n (language switcher) ──▶ Phase 5  RTL  (commonly shipped together)
   └─▶ Phase 6  Meta/SEO + stderr + docs
```

Suggested order: **0 → 1 → 2 → 3 → (4 → 5) → 6**. Phases 1–6 are largely independent
after Phase 0 and can be parallelised across contributors.

## Open questions for maintainers

1. **Upstream-first?** Several of these (git metadata rendering, language switcher,
   RTL) could be contributed to `jupyter-book/myst-theme` rather than kept QuantEcon-only.
   Which features are worth upstreaming vs forking?
2. **Plugin home:** should the build-time git-metadata plugin (Phase 1) live in a shared
   `quantecon-myst-plugins` repo consumed by every lecture repo, or per-repo?
3. **Compute model:** how much of the launch story moves to in-page Thebe vs external
   Colab/Binder/Hub, given infra cost and the existing `.notebooks` convention?
4. **Scope for first migration:** which lectures migrate to JB≥2 first, and which subset
   of phases must land before that cutover (Phase 1 git-history is likely a must-have)?
