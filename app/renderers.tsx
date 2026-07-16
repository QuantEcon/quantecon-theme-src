import type { GenericNode } from 'myst-common';
import type { NodeRenderers } from '@myst-theme/providers';
import { MyST } from 'myst-to-react';

/**
 * Fancy ordered lists (QuantEcon/mystmd#50): `list` nodes carry `style`
 * (lower-alpha | upper-alpha | lower-roman | upper-roman) and `delimiter`
 * (paren | parens) for Pandoc fancy_lists markers such as `a.`, `iv.`, `(i)`.
 *
 * myst-to-react's `list` renderer drops both fields, so `(a)` / `(i)` lists
 * render with decimal markers (#100). This override maps `style` to the
 * `<ol type>` attribute and exposes `delimiter` as a `delimiter-paren` /
 * `delimiter-parens` class consumed by styles/lists.css — the same hook the
 * fork's `myst-to-html` emits, so one CSS spec serves both renderers.
 *
 * Drop this override (and styles/lists.css) once the fix lands in upstream
 * jupyter-book/myst-theme alongside the fancy-lists mystmd upstreaming
 * (QuantEcon/mystmd#51).
 */
const OL_TYPE: Record<string, 'a' | 'A' | 'i' | 'I'> = {
  'lower-alpha': 'a',
  'upper-alpha': 'A',
  'lower-roman': 'i',
  'upper-roman': 'I',
};

export const LIST_RENDERERS: NodeRenderers = {
  list({ node, className }: { node: GenericNode; className?: string }) {
    if (node.ordered) {
      const delimiterClass =
        node.delimiter && node.delimiter !== 'period' ? `delimiter-${node.delimiter}` : undefined;
      return (
        <ol
          start={node.start || undefined}
          type={node.style ? OL_TYPE[node.style] : undefined}
          id={node.html_id}
          className={[className, delimiterClass].filter(Boolean).join(' ') || undefined}
        >
          <MyST ast={node.children} />
        </ol>
      );
    }
    return (
      <ul id={node.html_id} className={className}>
        <MyST ast={node.children} />
      </ul>
    );
  },
};
