import { test, expect, Page } from "@playwright/test";

/**
 * Full-page visual snapshots of the fixture, one per rendering surface.
 * `notebook` is the one that matters most for the 2.0.0 move — it exercises
 * the `@myst-theme` v1.0.0 output-node AST change (stream / execute_result /
 * error outputs).
 */
async function settle(page: Page) {
  // Not `networkidle` — the runtime theme can hold a persistent connection
  // open, so it never fires. Wait for load + a beat for math/webfonts.
  await page.waitForLoadState("load");
  await page.waitForFunction(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(1500);
}

// Route slugs are derived from the fixture filenames; `intro` is the home page.
const pages = [
  { name: "intro", path: "/" },
  { name: "features", path: "/features" },
  { name: "notebook", path: "/notebook" },
];

test.describe("QuantEcon theme — visual regression", () => {
  for (const p of pages) {
    test(p.name, async ({ page }) => {
      await page.goto(p.path, { waitUntil: "domcontentloaded" });
      await settle(page);
      await expect(page).toHaveScreenshot(`${p.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
});
