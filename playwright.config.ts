import { defineConfig, devices } from "@playwright/test";

/**
 * Visual-regression config for the QuantEcon MyST theme.
 *
 * Unlike the Sphinx book-theme (static HTML), this theme is a runtime Remix
 * server, so tests run against a live `myst start` of the fixture in
 * `tests/visual/fixture`, with the theme under test selected via the
 * `THEME_TEMPLATE` env var (see `tests/visual/serve.sh` and the README).
 *
 * Before/after the 2.0.0 upgrade:
 *   1. baseline (v1.1.1): THEME_TEMPLATE=<deployed main zip>  npm run test:visual:update
 *   2. candidate (2.0.0): THEME_TEMPLATE=<local build dir>    npm run test:visual
 * Diffs in step 2 are exactly what the upgrade changed.
 */
const PORT = process.env.PORT || "3111";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  snapshotPathTemplate: "{testDir}/__snapshots__/{projectName}/{arg}{ext}",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "bash tests/visual/serve.sh",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  },
});
