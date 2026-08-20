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

/**
 * Slack, in CSS px, allowed on the parked nav panel's right edge.
 *
 * `translateX(-100%)` puts that edge at exactly 0 in theory, but the panel is
 * unstyled at this point, so its width is shrink-to-fit and lands on a
 * fractional value (135.171875px in WebKit here). WebKit snaps the painted
 * translate to a whole device pixel while leaving the border-box width
 * fractional, so the measured edge comes back at +0.171875 rather than 0 — the
 * exact remainder varies with the intrinsic width, hence with platform font
 * metrics. A strict `> 0` test therefore passes on the ubuntu CI runner and
 * fails on macOS for the same, correct, markup.
 *
 * 1px is well inside "not visible" and well outside any snapping remainder.
 */
const OFFSCREEN_EPS = 1;

/**
 * Aborts external stylesheets, optionally stripping the inline critical block.
 *
 * Returns a `strippedCritical` probe rather than trusting the regex to have
 * matched. If `CRITICAL_CSS` is ever reshaped so the pattern stops matching,
 * the control would otherwise run against a fully-styled page and fail on its
 * *assertions* — reporting "expected block, received grid", which points at the
 * critical CSS rather than at the stale pattern that is actually at fault.
 * Asserting this probe turns that into a failure that names itself.
 */
async function isolateInlineCss(page: Page, { stripCritical = false } = {}) {
  const probe = { strippedCritical: false };
  await page.route("**/*", async (route: Route) => {
    const req = route.request();

    // External stylesheets never apply -> isolates the inline critical CSS.
    if (req.resourceType() === "stylesheet" || /\.css(\?|$)/i.test(req.url())) {
      return route.abort();
    }

    // Control: serve the document with the inlined critical <style> removed.
    if (req.resourceType() === "document" && stripCritical) {
      const response = await route.fetch();
      const served = await response.text();
      const body = served.replace(
        /<style>[^<]*:where\(\.simple-center-grid\)[^<]*<\/style>/g,
        "<!-- critical CSS removed for control -->",
      );
      if (body !== served) probe.strippedCritical = true;
      return route.fulfill({ response, body });
    }

    return route.continue();
  });
  return probe;
}

/**
 * Key under which the in-page sampler parks its measurement on `window`.
 */
const SAMPLE_KEY = "__qeFirstPaint";

type FirstPaint = {
  gridDisplay: string;
  bodyFont: string;
  sidebarRight: number | null;
  appliedExternal: boolean;
  criticalInline: boolean;
};

/**
 * Measure at first paint, from inside the page, before React hydrates.
 *
 * The measurement used to run from the test after `domcontentloaded`, which
 * left roughly a 150ms budget before hydration. That is not enough: hydration
 * currently fails on every load (React #418/#423, tracked in #126), and the
 * recovery re-render puts the critical `<style>` back — around 195ms in
 * sampling. The control strips that block from the served HTML precisely to
 * prove the guard is meaningful, so when React restored it the control's
 * assertions all flipped at once and `fouc-guard` went red for reasons that had
 * nothing to do with the critical CSS.
 *
 * Sampling from an init script closes that window: it runs on
 * `DOMContentLoaded`, in-page and synchronously, and it reads only the DOM. The
 * ordering is empirical rather than guaranteed — Remix v1 emits its entry as an
 * inline `type="module" async` script whose imports must resolve before
 * `entry.client.tsx` even schedules `requestIdleCallback`/`setTimeout` for
 * `hydrateRoot`, and WebKit dispatches DOMContentLoaded at end of parse — but
 * that ordering is what the #126 timings show, with the earliest observed
 * restoration an order of magnitude later than the sample.
 *
 * Note this deliberately survives a *fixed* #126: a control that strips the
 * inline block guarantees a hydration mismatch by construction, so no repair to
 * the hydration failure itself could make a post-hydration sample safe here.
 */
async function firstPaintState(page: Page): Promise<FirstPaint> {
  await page.addInitScript((key) => {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        const grid = document.querySelector(".simple-center-grid");
        const sidebar = document.querySelector(".qe-contents-sidebar");
        const applied = Array.from(document.styleSheets).filter((sheet) => {
          try {
            return !!sheet.cssRules && sheet.cssRules.length > 0; // applied, not pending
          } catch {
            return false; // cross-origin / not yet loaded
          }
        });
        const sample = {
          gridDisplay: grid ? getComputedStyle(grid).display : "(absent)",
          bodyFont: getComputedStyle(document.body).fontFamily,
          sidebarRight: sidebar ? sidebar.getBoundingClientRect().right : null,
          appliedExternal: applied.some((sheet) => !!sheet.href),
          // Whether the inline block is present in the document as sampled —
          // the state the assertions below are actually about.
          criticalInline: Array.from(document.querySelectorAll("style")).some((el) =>
            (el.textContent ?? "").includes(":where(.simple-center-grid)"),
          ),
        };
        (window as unknown as Record<string, unknown>)[key] = sample;
      },
      { once: true },
    );
  }, SAMPLE_KEY);

  await page.goto(PAGE, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((key) => !!(window as any)[key], SAMPLE_KEY, { timeout: 5000 });
  const state = await page.evaluate<FirstPaint, string>(
    (key) => (window as any)[key],
    SAMPLE_KEY,
  );
  return state;
}

test.describe("FOUC guard (WebKit) — inline critical CSS styles the first paint", () => {
  test("page-as-served is styled even with external CSS unavailable", async ({ page }) => {
    await isolateInlineCss(page);
    const state = await firstPaintState(page);

    // No external sheet applied, so anything styled below comes from inline CSS.
    expect(state.appliedExternal).toBe(false);
    expect(
      state.criticalInline,
      "the inline critical <style> is missing from the page as served — app/root.tsx no longer inlines CRITICAL_CSS"
    ).toBe(true);
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
      state.sidebarRight,
      "`.qe-contents-sidebar` not found — the hook the critical CSS targets was renamed or removed"
    ).not.toBeNull();
    // Nav panel parked off-screen (right edge at 0, modulo the sub-pixel slack).
    expect(state.sidebarRight).toBeLessThan(OFFSCREEN_EPS);
  });

  test("control: removing the inline critical CSS reproduces the FOUC", async ({ page }) => {
    const probe = await isolateInlineCss(page, { stripCritical: true });
    const state = await firstPaintState(page);

    // Preconditions first, so a stale strip pattern reports as itself rather
    // than as three confusing assertion failures about the critical CSS.
    expect(
      probe.strippedCritical,
      "the strip pattern matched nothing in the served HTML — CRITICAL_CSS was reshaped and the regex in isolateInlineCss needs updating"
    ).toBe(true);
    expect(
      state.criticalInline,
      "the inline critical <style> is present despite the strip — it was restored before the sample (see #126)"
    ).toBe(false);

    // With no CSS at all, the page is unstyled — this proves the guard above is
    // meaningful (the external abort really does strip styling).
    expect(state.appliedExternal).toBe(false);
    expect(state.gridDisplay).toBe("block");
    expect(state.bodyFont).not.toMatch(/Source Sans 3/);
    // Without the inline rule the nav panel lays out in-flow and fully visible —
    // this is the "menu flashes open on load" symptom. Measured at ~1272px of a
    // 1280px viewport, so the margin over OFFSCREEN_EPS is three orders of
    // magnitude: the two states are never in danger of being confused.
    expect(
      state.sidebarRight,
      "`.qe-contents-sidebar` not found — the hook the critical CSS targets was renamed or removed"
    ).not.toBeNull();
    expect(state.sidebarRight).toBeGreaterThan(OFFSCREEN_EPS);
  });
});
