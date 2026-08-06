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
  // Fancy ordered lists (#100/#101): markers stamped by the fixture's
  // fancy-lists.mjs plugin, so coverage is independent of the CLI's parser.
  { name: "lists", path: "/lists" },
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

  // The "Last changed" header control and its inline changelog. The fixture
  // pins git_metadata in features.md frontmatter and the clock is frozen, so
  // the relative times ("4 months ago") are deterministic.
  //
  // The agreed design (#83) is a disclosure that expands *above* the header's
  // blue divider, pushing it down — keeping the changelog adjacent to its
  // toggle and out of the lecture content. The geometry assertions below pin
  // that, since a panel that rendered below the divider would still look
  // plausible in isolation.
  const BLUE_DIVIDER_BLOCK = '[class*="border-b-qeborder-blue"]';
  const dividerBottom = (page: Page) =>
    page.evaluate(
      (sel) => document.querySelector(sel)!.getBoundingClientRect().bottom,
      BLUE_DIVIDER_BLOCK
    );

  test("history-open", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-06-12T00:00:00Z"));
    await page.goto("/features", { waitUntil: "domcontentloaded" });
    await settle(page);
    const trigger = page.getByRole("button", { name: /Last changed/ });
    await expect(trigger).toContainText("Last changed: Jan 15, 2026");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    const closedDivider = await dividerBottom(page);
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // The panel is whatever the trigger says it controls — this also checks
    // the aria wiring rather than assuming a selector.
    const panelId = await trigger.getAttribute("aria-controls");
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toBeVisible();
    await expect(panel.getByText("Changelog", { exact: true })).toBeVisible();
    // Commit links point at the source repo (myst.yml `github`), full history
    // at the mystmd-computed source path.
    await expect(panel.getByRole("link", { name: "3f9d2c4" })).toHaveAttribute(
      "href",
      "https://github.com/QuantEcon/quantecon-theme.mystmd/commit/3f9d2c41b8a7e6f5d4c3b2a1908f7e6d5c4b3a29"
    );
    await expect(panel.getByRole("link", { name: "full history" })).toHaveAttribute(
      "href",
      /\/commits\/.*features\.md$/
    );
    await expect(panel.getByText("4 months ago")).toBeVisible();

    // Opening pushes the blue divider down, and the panel stays above it.
    const openDivider = await dividerBottom(page);
    expect(openDivider).toBeGreaterThan(closedDivider);
    const panelBottom = (await panel.boundingBox())!.y + (await panel.boundingBox())!.height;
    expect(panelBottom).toBeLessThanOrEqual(openDivider);

    // DrDrij's "keep font sizes consistent": the toggle and the changelog copy
    // are one type size (0.85rem), so the block reads as a unit.
    const sizes = await page.evaluate(
      ({ id }) => {
        const p = document.getElementById(id)!;
        const btn = document.querySelector<HTMLElement>(
          `button[aria-controls="${CSS.escape(id)}"]`
        )!;
        return {
          trigger: getComputedStyle(btn).fontSize,
          entry: getComputedStyle(p.querySelector("li")!).fontSize,
        };
      },
      { id: panelId! }
    );
    expect(sizes.entry).toBe(sizes.trigger);

    await expect(page).toHaveScreenshot("history-open.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    });

    // Esc closes the disclosure and returns focus to the trigger.
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  // Marker-level assertions for the fancy-list page: a wrong marker case
  // ((A) where (a) is expected) moves far too few pixels for the full-page
  // snapshot's 1% diff budget, so pin the DOM/computed styles directly.
  // Ordering matches lists.md: alpha-parens, roman-parens, upper-alpha-paren,
  // roman-period, decimal control.
  test("lists-markers", async ({ page }) => {
    await page.goto("/lists", { waitUntil: "domcontentloaded" });
    await settle(page);
    const lists = await page.evaluate(() =>
      Array.from(document.querySelectorAll("article ol, main ol")).map((ol) => ({
        type: ol.getAttribute("type"),
        className: ol.className,
        listStyleType: getComputedStyle(ol).listStyleType,
        // Specified `content` of the drawn marker, e.g. `"(" counter(list-item, lower-alpha) ")"`.
        // Case-sensitive check that the right rule matched — ol[type] selectors
        // are case-insensitive in HTML, which is exactly the regression this guards.
        liBefore: getComputedStyle(ol.querySelector("li")!, "::before").content,
      }))
    );
    expect(lists).toHaveLength(5);
    expect(lists[0]).toMatchObject({ type: "a", listStyleType: "none" });
    expect(lists[0].className).toContain("list-lower-alpha");
    expect(lists[0].className).toContain("delimiter-parens");
    expect(lists[0].liBefore).toBe('"(" counter(list-item, lower-alpha) ")"');
    expect(lists[1]).toMatchObject({ type: "i", listStyleType: "none" });
    expect(lists[1].liBefore).toBe('"(" counter(list-item, lower-roman) ")"');
    expect(lists[2]).toMatchObject({ type: "A", listStyleType: "none" });
    expect(lists[2].liBefore).toBe('counter(list-item, upper-alpha) ")"');
    expect(lists[3]).toMatchObject({ type: "i", listStyleType: "lower-roman" });
    expect(lists[3].liBefore).toBe("none");
    expect(lists[4]).toMatchObject({ type: null, listStyleType: "decimal" });
    expect(lists[4].liBefore).toBe("none");
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
