---
"@curvenote/quantecon-book": patch
---

Fix the Safari/WebKit flash of unstyled content (FOUC) on page navigation by inlining critical CSS in the document `<head>`.

Static builds navigate via full document loads, and WebKit paints the freshly-navigated document for ~1 frame before any `<link>` stylesheet applies — showing the default serif font and a collapsed (`display: block`) layout. The inlined critical block (base font + `.simple-center-grid` layout) parses synchronously with the document, so the first paint is already styled. Every rule is wrapped in `:where(...)` so it carries zero specificity and is superseded by the real stylesheet once it loads. See QuantEcon/quantecon-theme-src#66.
