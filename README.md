# QuantEcon Lecture Theme — for MyST Markdown

A dedicated MyST interactive book theme (`@quantecon/lecture-theme`) for the
QuantEcon lectures and books, distributed as a zip attached to each
[GitHub Release](https://github.com/QuantEcon/quantecon-theme.mystmd/releases).

- Responsive and mobile ready
- Notebook launch (Google Colab / private JupyterHub) with configurable repo, branch and paths
- In-page live compute via Thebe (JupyterLite / Pyodide by default)
- Git history in page headers ("Last changed" plus an inline changelog)
- Page Footer based on MyST Content
- Bundled QuantEcon brand assets

![](./template/thumbnail.png)

### Downloads

When downloads are available on a page, a download button will appear in the top toolbar.
The contents of the menu available from that button is configured via the [download configuration](https://mystmd.org/guide/website-downloads) of the MyST project and page.
Typically, a download of the entire book as a PDF is provided along with downloads of each lecture in PDF and Notebook (md) form.

To achieve this the following configuration should be added to build and expose the downloads.

At the project level:

```yaml
# myst.yml
project:
  ...
  exports:
    - id: book-pdf
      format: pdf
      template: plain_latex_book
      output: exports/quantecon-python-intro.pdf
  downloads:
    - id: book-pdf
      title: Book (PDF)
```

And then on each page:

```yaml
# long_run_growth.md
exports:
  - format: pdf
    template: plain_latex_book
    output: exports/long_run_growth.pdf
downloads:
  - file: exports/long_run_growth.pdf
    title: Lecture (PDF)
  - file: ./long_run_growth.md
    title: Notebook (md)
```

### Launch Notebooks

The launch notebooks capability has been developed to mirror capabilities in the previous QuantEcon theme. By default it assumes the `.notebooks` suffix convention for repository naming when launching both Google Colab and Private Jupyter Hub sessions.

Colab is the primary launch target (it provides GPU access for the lectures that
need it). BinderHub is deliberately not offered — it proved flaky in practice;
see issue [#26](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/26),
kept open as a demand-driven future request.

The repo/branch/path conventions are configurable under `site.options` in
`myst.yml` (MyST's theme-options section). All keys are optional and the
defaults reproduce the behaviour above, so existing projects need no changes:

| Option | Default | Purpose |
| ------ | ------- | ------- |
| `launch_repo_suffix` | `.notebooks` | Suffix appended to the source repo to locate the notebook repo |
| `launch_branch` | `main` | Branch in the notebook repo to launch from |
| `launch_repo_url` | _(derived from `github` + suffix)_ | Explicit notebook repo, for when it isn't `<source>.notebooks` |
| `launch_notebooks_path` | _(none)_ | Sub-directory within the notebook repo where the notebooks live |
| `launch_source_path` | _(none)_ | Path prefix stripped from the page location (e.g. a `lectures/` source dir) |

### Live compute (Thebe / JupyterLite)

In addition to launching a notebook elsewhere (Colab/Hub), the theme can run
notebook cells **in place** via [Thebe](https://thebe.readthedocs.io). This is
opt-in per project through the standard MyST `thebe` config, set under
`project.thebe` in `myst.yml` (the theme reads it from the project manifest, so
it is project-level — not per-page frontmatter). The QuantEcon default is
**JupyterLite** — Python runs entirely in the browser via Pyodide, with no
server or Binder to host:

```yaml
# myst.yml
project:
  thebe:
    lite: true
```

With this set, a **Power** toggle appears in the header toolbar (next to the
Launch button) on notebook pages. Clicking it boots the in-browser kernel, after
which **Run / Restart / Clear** take its place; cells then execute live. The
toggle lives in the fixed header so it stays visible while scrolling, and only
appears on notebook pages (desktop). It is the `@myst-theme/jupyter` notebook
toolbar, relocated into the header via a portal.

**Caveat:** Pyodide runs pure-Python plus packages compiled for it (numpy,
scipy, pandas, matplotlib, sympy). Packages that aren't available for Pyodide
(e.g. numba, JAX) won't import, so live compute suits lectures whose runtime
stack is Pyodide-compatible. Other backends are available through the same
`thebe` config (`binder:` for BinderHub, `server:` for a hosted Jupyter
server) if a project needs a full environment.

### Git history in page headers

The page header shows a "Last changed: ⟨date⟩" control (aligned to the right of
the author line) that expands an inline changelog listing the most recent
commits touching that page — commit hashes link to GitHub, and a "full history"
link opens the file's complete commit log (mirroring the `quantecon-book-theme`
header). The changelog opens in place above the header's blue divider, pushing
it down, so it stays adjacent to its toggle and clear of the lecture content.

The data is injected at build time by [`plugins/git-metadata.mjs`](./plugins/git-metadata.mjs),
a MyST transform that runs `git log --follow` per source file and attaches
`{ last_modified, changelog: [{hash, short_hash, author, date, message}] }`
to the page AST. Copy the plugin into a lecture repo (or reference a checkout)
and register it:

```yaml
# myst.yml
project:
  github: https://github.com/QuantEcon/lecture-python.myst # commit links target this repo
  plugins:
    - git-metadata.mjs
```

Notes:

- The header control renders nothing when no metadata is present, so projects
  without the plugin are unaffected.
- The plugin is a silent no-op for untracked files, non-git checkouts, missing
  `git`, or a `git log` timeout (5s). Shallow CI clones (`fetch-depth: 1`)
  produce truncated history — use `fetch-depth: 0` when building for deploy.
- `QE_GIT_METADATA_MAX` caps changelog entries per page (default 6; myst-cli
  does not pass options to transform plugins, hence the environment variable).
  The expanded changelog does not scroll — it grows to fit — so this value is
  also what controls how tall it gets.
- A page can pin or correct its history manually — set the same shape under
  `site.git_metadata` in the page frontmatter, which takes precedence over the
  injected data (this is how the visual fixture keeps snapshots deterministic).

## Usage with MyST

Point your project's `site.template` at a **pinned release** zip:

```yaml
# myst.yml
site:
  template: https://github.com/QuantEcon/quantecon-theme.mystmd/releases/download/v2.3.0/quantecon-theme.zip
```

Pin a specific version rather than tracking a branch, and bump it deliberately: the
[releases page](https://github.com/QuantEcon/quantecon-theme.mystmd/releases) carries the
changelog entry for each version, including anything consumers need to change.

Then start the local server:

```sh
myst start
```

Open up [http://localhost:3000](http://localhost:3000) and you should be ready to go!

## Development

After cloning the repository, install the packages and start the dev server
(with CSS watch and hot reload):

```sh
npm install
npm run dev
```

To preview against real MyST content instead, run a headless content server in
your content project (`myst start --headless`) alongside the theme dev server.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full development setup,
available scripts, and the test suites, and [`tests/visual/README.md`](./tests/visual/README.md)
for the visual-regression harness.

## Release

Releases are cut by pushing a `vX.Y.Z` git tag: the
[`release.yml`](./.github/workflows/release.yml) workflow builds the theme and
publishes a GitHub Release with `quantecon-theme.zip` attached, using that
version's [`CHANGELOG.md`](./CHANGELOG.md) section as the release notes. The
step-by-step flow is documented in
[`CONTRIBUTING.md`](./CONTRIBUTING.md#releases).
