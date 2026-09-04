import type { LinksFunction, V2_MetaFunction, LoaderFunction } from '@remix-run/node';
import tailwind from '~/styles/app.css';
import thebeCoreCss from 'thebe-core/dist/lib/thebe-core.css';
import { PTSerifCSS, SourceSans3CSS } from '~/links';
import { getConfig } from '~/backend/loaders.server';
import type { SiteLoader } from '@myst-theme/common';
import {
  Document,
  responseNoSite,
  getMetaTagsForSite,
  getThemeSession,
  ContentReload,
  SkipTo,
  renderers as defaultRenderers,
} from '@myst-theme/site';
import { createSearch as createMiniSearch } from '@myst-theme/search-minisearch';
import { Outlet, useLoaderData } from '@remix-run/react';
import type { NodeRenderers } from '@myst-theme/providers';
import { mergeRenderers, SearchFactoryProvider } from '@myst-theme/providers';
import type { ISearch, MystSearchIndex } from '@myst-theme/search';
import { SEARCH_ATTRIBUTES_ORDERED } from '@myst-theme/search';
import { useCallback } from 'react';
import { JUPYTER_RENDERERS } from '@myst-theme/jupyter';
import { LIST_RENDERERS } from './renderers';
export { AppErrorBoundary as ErrorBoundary } from '@myst-theme/site';

const RENDERERS: NodeRenderers = mergeRenderers([
  defaultRenderers,
  JUPYTER_RENDERERS,
  LIST_RENDERERS,
]);

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return getMetaTagsForSite({
    title: data?.config?.title,
    description: data?.config?.description,
    twitter: data?.config?.options?.twitter,
  });
};

/**
 * Critical CSS — inlined in <head> to fix the Safari/WebKit FOUC on navigation
 * (https://github.com/QuantEcon/quantecon-theme-src/issues/66).
 *
 * Static builds (`myst build --html`) navigate via full document loads, and
 * WebKit paints the freshly-navigated document for ~1 frame BEFORE any <link>
 * stylesheet applies — even the same-origin Tailwind app.css. That frame shows
 * the default serif font and the content grid collapsed to `display: block`
 * (i.e. the "raw HTML" flash users report). An inline <style> is parsed
 * synchronously with the document, so it styles that very first paint with no
 * network round-trip.
 *
 * Every selector is wrapped in `:where(...)` so these rules carry **zero**
 * specificity: they take effect only while nothing else has loaded, and the
 * real stylesheet (Tailwind preflight + @myst-theme/styles) always wins once it
 * arrives. This keeps the inline block from overriding the live cascade despite
 * being emitted after <Links /> in the document head.
 *
 * Because these rules carry no specificity, every property set here MUST also
 * be declared by the real stylesheet, otherwise it can never be overridden.
 * (E.g. parking the nav panel off-screen with `visibility:hidden` would stick
 * forever, since no Tailwind class sets `visibility` — hence the transform.)
 *
 * Keep the values in sync with their sources of truth:
 *   - font stack:    tailwind.config.js  -> theme.extend.fontFamily.sans
 *                    The `@font-face` rules for "Source Sans 3 Variable" are
 *                    self-hosted via app/links.ts, so they arrive in a <link>
 *                    and are NOT available at this first paint. The
 *                    `sans-serif` tail is what renders here and the webfont
 *                    swaps in once that stylesheet lands — as it did with the
 *                    Google Fonts @import this replaced. The metric-matched
 *                    "Source Sans 3 Fallback" face sits just before that tail;
 *                    it is declared below rather than in styles/app.css so it
 *                    is available at this first paint too. Being `local()`-only
 *                    it costs no request.
 *   - heading face:  styles/quantecon.css -> `.article h1/h2/h3` ("PT Serif",
 *                    self-hosted via app/links.ts like the sans above, so it is
 *                    likewise absent at first paint). Without this rule the
 *                    headings paint in the sans stack and swap to serif when
 *                    the Tailwind bundle lands; the generic `serif` fallback
 *                    here is far closer to the final shape.
 *   - content size:  styles/quantecon.css -> `.article` font-size (1.125rem).
 *                    Without it the article paints at the UA default 16px and
 *                    jumps to 18px when the Tailwind bundle lands, reflowing
 *                    the whole page on every cold load.
 *   - grid columns:  tailwind.config.js  -> theme.extend.gridTemplateColumns
 *                    (`simple-sm` / `simple-xl`), applied by `.simple-center-grid`
 *   - dark bg:       matches the page <body>, which @myst-theme/site renders as
 *                    `dark:bg-stone-900` (#1c1917) — note the <body> tag lives in
 *                    that upstream Document, not in this file. (This is the outer
 *                    page background; the inner content panel uses `qepage-dark`
 *                    #222, see app/components/Page.tsx — intentionally not set here
 *                    since these rules target <body>.)
 *   - nav panel:     app/components/ContentsSidebar.tsx -> `.qe-contents-sidebar`
 *                    (only the class name needs to stay in sync; see below)
 *
 * The nav-panel rule deliberately sets no width. `translateX(-100%)` resolves
 * against the element's own border box, so its right edge lands at `left + W -
 * W` = 0 for **any** width W — it is off-screen before app.css arrives and
 * stays off-screen after, even though the resolved width differs between the
 * two (350/250/350 across the base/lg/2xl bands). `position:fixed` is set so
 * the panel does not push the article down while it waits.
 */
const CRITICAL_CSS = `
@font-face{font-family:"Source Sans 3 Fallback";src:local("Helvetica"),local("Arial"),local("Liberation Sans"),local("Arimo");size-adjust:92.25%;ascent-override:111%;descent-override:43.36%;line-gap-override:0%}
:where(html){font-family:"Source Sans 3 Variable","Source Sans 3","Source Sans 3 Fallback",sans-serif}
:where(.article){font-size:1.125rem}
:where(.article h1,.article h2,.article h3){font-family:"PT Serif",serif}
:where(body){margin:0;background-color:#fff}
:where(.dark body){background-color:#1c1917}
:where([hidden],.hidden){display:none}
:where(.simple-center-grid){display:grid;grid-template-columns:[screen-start] 1fr [body-start] minmax(300px,800px) [body-end] 1fr [screen-end]}
:where(.simple-center-grid) > *{grid-column:body-start / body-end}
@media (min-width:1280px){:where(.simple-center-grid){grid-template-columns:[screen-start] 1fr 200px 20px [body-start] 800px [body-end] 20px [margin-start] 200px [margin-end] 1fr [screen-end]}}
:where(.qe-contents-sidebar){position:fixed;left:0;transform:translateX(-100%)}
`;

export const links: LinksFunction = () => {
  return [
    {
      rel: 'icon',
      href: '/favicon.ico',
    },
    // Self-hosted Source Sans 3 (see app/links.ts). Declared on the *root*
    // route rather than the two page routes like KatexCSS, because root's
    // links() are the only ones that also apply when the root ErrorBoundary
    // renders — a 404, or the missing-site response thrown below — and the body
    // font has to be right on those pages too.
    ...SourceSans3CSS,
    // Self-hosted PT Serif for the article headings (see app/links.ts). Also
    // on the root route: the ErrorBoundary pages render an <h1> too.
    ...PTSerifCSS,
    { rel: 'stylesheet', href: tailwind },
    { rel: 'stylesheet', href: thebeCoreCss },
    { rel: 'stylesheet', href: '/myst-theme.css' },
    // jupyter-matplotlib's stylesheet used to be pulled from jsdelivr here. It
    // is now vendored into the Tailwind bundle (styles/mpl-widget.css), which
    // drops a render-blocking request to a third-party CDN that is
    // intermittently unreachable in mainland China.
    // Font Awesome intentionally not loaded: nothing in the theme renders
    // `fa-*` classes; use the bundled `lucide-react` icons instead.
  ];
};

export const loader: LoaderFunction = async ({ request }): Promise<SiteLoader> => {
  const baseURL = process.env.BASE_URL || undefined;
  const [config, themeSession] = await Promise.all([
    getConfig().catch(() => null),
    getThemeSession(request),
  ]);
  if (!config) throw responseNoSite();
  const data = {
    theme: themeSession.getTheme(),
    config,
    CONTENT_CDN_PORT: process.env.CONTENT_CDN_PORT ?? 3100,
    MODE: (process.env.MODE ?? 'app') as 'app' | 'static',
    BASE_URL: baseURL,
  };
  return data;
};

function createSearch(index: MystSearchIndex): ISearch {
  const options = {
    fields: SEARCH_ATTRIBUTES_ORDERED as any as string[],
    storeFields: ['hierarchy', 'content', 'url', 'type', 'id', 'position'],
    idField: 'id',
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
    },
  };
  return createMiniSearch(index.records, options);
}

export default function AppWithReload() {
  const { theme, config, CONTENT_CDN_PORT, MODE, BASE_URL } = useLoaderData<SiteLoader>();

  const searchFactory = useCallback((index: MystSearchIndex) => createSearch(index), []);

  return (
    <SearchFactoryProvider factory={searchFactory}>
      <Document
        theme={theme}
        config={config}
        scripts={MODE === 'static' ? undefined : <ContentReload port={CONTENT_CDN_PORT} />}
        staticBuild={MODE === 'static'}
        baseurl={BASE_URL}
        renderers={RENDERERS}
        top={50}
        // dangerouslySetInnerHTML is required, not incidental: CRITICAL_CSS uses a
        // child combinator (`.simple-center-grid > *`), and React escapes `>` to
        // `&gt;` in <style> text children during SSR. Browsers don't decode entities
        // inside <style>, so `<style>{CRITICAL_CSS}</style>` would emit an invalid
        // selector and silently drop the body-column rule. Keep this as-is.
        head={<style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />}
      >
        <SkipTo
          targets={[
            { id: 'skip-to-frontmatter', title: 'Skip to article frontmatter' },
            { id: 'skip-to-article', title: 'Skip to article content' },
          ]}
        />
        <Outlet />
      </Document>
    </SearchFactoryProvider>
  );
}
