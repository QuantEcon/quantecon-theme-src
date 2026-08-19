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
    const sidebar = document.querySelector(".qe-contents-sidebar");
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
      // The nav panel is closed on load, so it must start fully off-screen to
      // the left. If it is on-screen here the menu visibly flashes open.
      // `null` (not `false`) when the element is missing: `false` is the value
      // that *passes* the guard below, so a renamed hook would slip through it
      // and surface as a confusing failure in the control instead.
      sidebarOnScreen: sidebar ? sidebar.getBoundingClientRect().right > 0 : null,
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
    expect(state.bodyFont).toMatch(/Source Sans 3/); // sans, not the serif default
    expect(
      state.sidebarOnScreen,
      "`.qe-contents-sidebar` not found — the hook the critical CSS targets was renamed or removed"
    ).not.toBeNull();
    expect(state.sidebarOnScreen).toBe(false); // nav panel parked off-screen
  });

  test("control: removing the inline critical CSS reproduces the FOUC", async ({ page }) => {
    await isolateInlineCss(page, { stripCritical: true });
    const state = await firstPaintState(page);

    // With no CSS at all, the page is unstyled — this proves the guard above is
    // meaningful (the external abort really does strip styling).
    expect(state.appliedExternal).toBe(false);
    expect(state.gridDisplay).toBe("block");
    expect(state.bodyFont).not.toMatch(/Source Sans 3/);
    // Without the inline rule the nav panel lays out in-flow and fully visible —
    // this is the "menu flashes open on load" symptom.
    expect(
      state.sidebarOnScreen,
      "`.qe-contents-sidebar` not found — the hook the critical CSS targets was renamed or removed"
    ).not.toBeNull();
    expect(state.sidebarOnScreen).toBe(true);
  });
});
