# Contributing to quantecon-theme-src

Thank you for your interest in contributing to the QuantEcon theme!

## Prerequisites

- **Node.js** ≥ 18 (see `.nvmrc`)
- **npm** 8.x (see `packageManager` in `package.json`)

## Development Setup

```bash
# Clone the repository
git clone https://github.com/QuantEcon/quantecon-theme-src.git
cd quantecon-theme-src

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

Releases are managed via [Changesets](https://github.com/changesets/changesets). To propose a version bump:

```bash
npm run changeset
```

Follow the prompts, then commit the generated changeset file with your PR.

## Notes

- The theme is built on [Remix v1](https://remix.run/) and [@myst-theme](https://github.com/jupyter-book/myst-theme).
- Tailwind CSS is used for styling — see `tailwind.config.js` for the theme configuration.
- TypeScript strict mode is enabled — all code must pass `tsc --noEmit`.
