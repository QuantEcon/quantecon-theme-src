# Contributing to quantecon-theme.mystmd

Thank you for your interest in contributing to the QuantEcon theme!

## Prerequisites

- **Node.js** ≥ 18 (see `.nvmrc`). Running the unit tests (`npm run test:unit`)
  additionally requires **Node ≥ 23.6**, which strips TypeScript on the fly so the
  tests can import the `.ts` builders without a build step — this matches the CI
  Node 24 runner. The built theme itself still supports Node ≥ 20 (`engines.node`).
- **npm** 8.x (see `packageManager` in `package.json`)

## Development Setup

```bash
# Clone the repository
git clone https://github.com/QuantEcon/quantecon-theme.mystmd.git
cd quantecon-theme.mystmd

# Install dependencies
npm install

# Start the development server (with hot reload)
npm run dev
```

The dev server runs at `http://localhost:3000` by default.

## Available Scripts

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start dev server with CSS watch + hot reload     |
| `npm run prod:build`| Production build (CSS + Thebe assets + Remix)    |
| `npm run compile`   | TypeScript type-check (`tsc --noEmit`)           |
| `npm run test:unit` | Pure-function unit tests (`node --test`, Node ≥ 23.6) |
| `npm run format`    | Format code with Prettier                        |
| `npm run clean`     | Remove build artifacts                           |

## Project Structure

```
app/
  backend/       # Server-side loaders (Remix loader functions)
  components/    # React components (toolbar/, sidebar, page layout)
  hooks/         # Custom React hooks
  routes/        # Remix route modules
  root.tsx       # App shell (document head, theme providers)
styles/
  app.css        # Tailwind CSS entry point
public/          # Static assets (logos, Thebe bundles)
patches/         # patch-package patches for upstream fixes
```

## Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Run type-checking** before committing:
   ```bash
   npm run compile
   ```

3. **Test a production build** to catch build-time issues:
   ```bash
   npm run prod:build
   ```

4. **Open a Pull Request** against `main`. CI will run type-check and build automatically.

## Commit Convention

We use conventional commits:

- `fix:` — Bug fixes
- `feat:` — New features
- `chore:` — Maintenance (deps, config, CI)
- `docs:` — Documentation only
- `ci:` — CI/workflow changes

## Releases

Versioning is **manual**: a curated [Keep a Changelog](https://keepachangelog.com/) entry +
a `vX.Y.Z` git tag. (Changesets was removed — see [#71](https://github.com/QuantEcon/quantecon-theme-src/issues/71).)

As you work, add your change to the `## [Unreleased]` section of [`CHANGELOG.md`](./CHANGELOG.md)
under the appropriate category (`Added` / `Changed` / `Fixed` / `Security` / `Dependencies`),
with a link to the PR.

To cut a release:

1. In `CHANGELOG.md`, move the `## [Unreleased]` entries under a new `## [X.Y.Z] - YYYY-MM-DD`
   heading and add the footer compare link.
2. Bump the version in `package.json` (e.g. `npm version X.Y.Z --no-git-tag-version`).
   You do **not** need to bump `template.yml` — the release workflow stamps its `version`
   from `package.json` into the published bundle, so the two cannot drift.
3. Commit (`chore(release): prepare vX.Y.Z`) and open a PR.
4. After merge, tag the release commit and push the tag:
   ```bash
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```
5. The tag triggers [`release.yml`](./.github/workflows/release.yml), which builds the
   theme, zips the bundle, and publishes a **GitHub Release** for the tag with
   `quantecon-theme.zip` attached, using the version's `CHANGELOG.md` section as the
   release notes. The workflow **fails** if the tag does not match `package.json` or if
   `CHANGELOG.md` has no `## [X.Y.Z]` section.

If a release run fails, the failed run published nothing, so recovery is safe:

- **Transient build failure** (e.g. the occasional esbuild hang): no changes needed —
  re-run the failed workflow from the Actions UI.
- **Guard failure** (version mismatch / missing changelog section): land the fix on
  `main` via a PR, then **move the tag** to the new commit — a pushed tag cannot simply
  be re-pushed:
  ```bash
  git tag -f vX.Y.Z <new-commit-sha>
  git push --force origin vX.Y.Z
  ```

To test the bundle/artifact locally without cutting a release, use
`make build-theme` (assembles the bundle into `.deploy/quantecon-theme`, as used
by the visual test harness) or `make build-zip` (also produces the
release-equivalent zip).

## Notes

- The theme is built on [Remix v1](https://remix.run/) and [@myst-theme](https://github.com/jupyter-book/myst-theme).
- Tailwind CSS is used for styling — see `tailwind.config.js` for the theme configuration.
- TypeScript strict mode is enabled — all code must pass `tsc --noEmit`.
