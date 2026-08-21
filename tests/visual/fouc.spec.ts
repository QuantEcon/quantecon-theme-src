import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * FOUC guard (WebKit) — QuantEcon/quantecon-theme-src#66.
 *
 * In the static build every navigation is a full document load, and WebKit
 * paints the fresh document *before* its external `<link>` stylesheets apply —
 * so for ~1 frame the page renders with the default serif font and the content
 * grid collapsed to `display: block`. The fix inlines critical CSS into `<head>`
 * (see `app/root.tsx`), which parses synchronously and styles that first paint.
 *
 * The same unstyled frame also exposed the contents sidebar: `-translate-x-full`
 * does nothing until app.css lands, so the panel painted in-flow and visible,
 * then slid shut once the stylesheet arrived — the "menu opens on load" report.
 * It is covered here too, since the cause and the guard are the same.
 *
 * This test makes the failure mode deterministic by **aborting all external
 * stylesheets**, so the only styling that can reach the page is the inline
 * `<style>`. If the inline critical CSS regresses, the "styled first paint"
 * assertion below fails. The control case strips the inline block to prove the
 * abort genuinely removes external styling (otherwise the guard would be moot).
 *
 * Runs in the `webkit-fouc` Playwright project only — Chromium paint-holds and
 * cannot exhibit this flash.
 */

const PAGE = "/";

async function isolateInlineCss(page: Page, { stripCritical = false } = {}) {
  await page.route("**/*", async (route: Route) => {
    const req = route.request();

    // External stylesheets never apply -> isolates the inline critical CSS.
    if (req.resourceType() === "stylesheet" || /\.css(\?|$)/i.test(req.url())) {
      return route.abort();
    }

    // Control: serve the document with the inlined critical <style> removed.
    if (req.resourceType() === "document" && stripCritical) {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        /<style>[^<]*:where\(\.simple-center-grid\)[^<]*<\/style>/g,
        "<!-- critical CSS removed for control -->",
      );
      return route.fulfill({ response, body });
    }

    return route.continue();
  });
}

async function firstPaintState(page: Page) {
  await page.goto(PAGE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".simple-center-grid", { timeout: 5000 }).catch(() => {});
  return page.evaluate(() => {
    const grid = document.querySelector(".simple-center-grid");
    const sidebar = document.querySelector(".qe-toc");
    const applied = Array.from(document.styleSheets).filter((sheet) => {
      try {
        return !!sheet.cssRules && sheet.cssRules.length > 0; // applied, not pending
      } catch {
        return false; // cross-origin / not yet loaded
      }
    });
    return {
      gridDisplay: grid ? getComputedStyle(grid).display : "(absent)",
      bodyFont: getComputedStyle(document.body).fontFamily,
      // The contents drawer is a popover, so while closed the UA stylesheet
      // gives it `display: none` and it generates no boxes at all. That is a
      // stronger guarantee than the transform it replaced: it holds on the
      // first paint with no author CSS whatsoever, which is why the control
      // below expects it hidden too rather than flashing open.
      //
      // `null` when the element is missing, so a renamed hook fails the
      // explicit presence guard instead of silently satisfying "not rendered".
      sidebarRendered: sidebar ? sidebar.getClientRects().length > 0 : null,
      // null href == an inline <style>; any string == an external sheet that applied
      appliedExternal: applied.some((sheet) => !!sheet.href),
    };
  });
}

test.describe("FOUC guard (WebKit) — inline critical CSS styles the first paint", () => {
  test("page-as-served is styled even with external CSS unavailable", async ({ page }) => {
    await isolateInlineCss(page);
    const state = await firstPaintState(page);

    // No external sheet applied, so anything styled below comes from inline CSS.
    expect(state.appliedExternal).toBe(false);
    // The reported FOUC symptoms must be absent on first paint:
    expect(state.gridDisplay).toBe("grid"); // grid not collapsed to block
    // Head of the stack, not just a substring: "Source Sans 3 Variable" (the
    // family name of the self-hosted webfont) contains "Source Sans 3", so the
    // looser regex would keep passing if CRITICAL_CSS and tailwind.config.js
    // drifted apart. This reads the *declared* stack — the @font-face rules
    // live in a <link>, which this test aborts, so what actually paints is the
    // `sans-serif` tail. That is the point: the guard is about sans-vs-serif,
    // not about the webfont having arrived.
    expect(state.bodyFont).toMatch(/^["']?Source Sans 3 Variable["']?\s*,/);
    expect(
      state.sidebarRendered,
      "`.qe-toc` not found — the contents drawer was renamed or removed"
    ).not.toBeNull();
    expect(state.sidebarRendered).toBe(false); // closed popover paints nothing
  });

  test("control: removing the inline critical CSS reproduces the FOUC", async ({ page }) => {
    await isolateInlineCss(page, { stripCritical: true });
    const state = await firstPaintState(page);

    // With no CSS at all, the page is unstyled — this proves the guard above is
    // meaningful (the external abort really does strip styling).
    expect(state.appliedExternal).toBe(false);
    expect(state.gridDisplay).toBe("block");
    expect(state.bodyFont).not.toMatch(/Source Sans 3/);
    // The drawer stays hidden even here, with every stylesheet stripped: it is
    // the UA stylesheet that hides a closed popover, not anything we ship. This
    // used to be the assertion that the panel flashed open, and its inversion
    // is the point of the rewrite — the failure mode no longer exists to guard.
    expect(
      state.sidebarRendered,
      "`.qe-toc` not found — the contents drawer was renamed or removed"
    ).not.toBeNull();
    expect(state.sidebarRendered).toBe(false);
  });
});
