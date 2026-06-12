# QuantEcon Lecture Theme — for MyST Markdown

A dedicated MyST interactive book theme (`@quantecon/lecture-theme`) for the
QuantEcon lectures and books, distributed as a zip attached to each
[GitHub Release](https://github.com/QuantEcon/quantecon-theme.mystmd/releases).

- Responsive and mobile ready
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

The launch notebooks capability has been developed to mirror capabilities in the previous QuantEcon theme. It is assumed that the `.notebooks` suffix convention for repository naming is used when launching both Google Colab and Private Jupyter Hub sessions.

Colab is the primary launch target (it provides GPU access for the lectures that
need it). BinderHub is deliberately not offered — it proved flaky in practice;
see issue [#26](https://github.com/QuantEcon/quantecon-theme.mystmd/issues/26),
kept open as a demand-driven future request.

## Usage with MyST

Point your project's `site.template` at a **pinned release** zip:

```yaml
# myst.yml
site:
  template: https://github.com/QuantEcon/quantecon-theme.mystmd/releases/download/v2.1.0/quantecon-theme.zip
```

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
