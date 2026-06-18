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

  // The "Last changed" header control and its centred changelog modal. The
  // fixture pins git_metadata in features.md frontmatter and the clock is
  // frozen, so the relative times ("4 months ago") are deterministic. Viewport
  // snapshot, not fullPage — the modal is a fixed-position portal overlay.
  test("history-open", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-06-12T00:00:00Z"));
    await page.goto("/features", { waitUntil: "domcontentloaded" });
    await settle(page);
    const trigger = page.getByRole("button", { name: /Last changed/ });
    await expect(trigger).toContainText("Last changed: Jan 15, 2026");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Changelog", { exact: true })).toBeVisible();
    // Commit links point at the source repo (myst.yml `github`), full history
    // at the mystmd-computed source path.
    await expect(dialog.getByRole("link", { name: "3f9d2c4" })).toHaveAttribute(
      "href",
      "https://github.com/QuantEcon/quantecon-theme.mystmd/commit/3f9d2c41b8a7e6f5d4c3b2a1908f7e6d5c4b3a29"
    );
    await expect(dialog.getByRole("link", { name: "full history" })).toHaveAttribute(
      "href",
      /\/commits\/.*features\.md$/
    );
    await expect(dialog.getByText("4 months ago")).toBeVisible();
    await expect(page).toHaveScreenshot("history-open.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });
    // Esc closes the modal (Radix dialog behavior the header relies on).
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  // The Contents sidebar is off-canvas by default, so the full-page snapshots
  // above never see it — #70 (unlinked sidebar entries) was invisible to them.
  // Open it and snapshot the viewport (not fullPage: stitching a scrolled page
  // with a fixed overlay produces artifacts).
  test("sidebar-open", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.locator('button:has([aria-label="Show table of contents"])').click();
    // The open state is a 300ms translate transition; wait for the sidebar to
    // be fully on-screen (its "Contents" heading at ratio 1) rather than a
    // fixed delay.
    await expect(page.getByText("Contents", { exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page).toHaveScreenshot("sidebar-open.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });
  });

  // Launch popover: Colab is the default and primary target (BinderHub is
  // deliberately not offered — #26). window.open is stubbed so the launch URL
  // assertion is deterministic and offline; the URL's repo part comes from the
  // fixture's `github` field, so only the stable pieces (host, .notebooks
  // convention, branch, path) are pinned.
  test("launch-colab", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chrome",
      "the launch popover lives in the desktop toolbar; mobile wraps it in MobileActionsMenu"
    );
    await page.goto("/notebook", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.evaluate(() => {
      (window as any).__opened = [];
      window.open = (url?: string | URL) => {
        (window as any).__opened.push(String(url));
        return null;
      };
    });
    await page.getByRole("button", { name: "Launch notebook" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("radio", { name: "Google Colab" })).toBeChecked();
    await expect(dialog.getByRole("radio", { name: "Private" })).toBeVisible();
    await expect(page).toHaveScreenshot("launch-open.png", {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });
    await dialog.getByRole("button", { name: "Launch Notebook" }).click();
    const opened = await page.evaluate(() => (window as any).__opened);
    expect(opened).toHaveLength(1);
    expect(opened[0]).toMatch(
      /^https:\/\/colab\.research\.google\.com\/github\/QuantEcon\/[\w.-]+\.notebooks\/blob\/main\/notebook\.ipynb$/
    );
  });
});
