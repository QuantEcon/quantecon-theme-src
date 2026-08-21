/**
 * Popover API attribute typings.
 *
 * React 18's JSX types predate the Popover API, so `popover` and
 * `popovertarget` are not on the built-in attribute interfaces even though
 * react-dom renders them correctly (verified: both survive `renderToString`
 * on 18.3.1, since React passes through unknown lowercase attributes).
 *
 * Remove this file when the project moves to React 19, which types them.
 */
import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    popover?: 'auto' | 'manual';
  }

  interface ButtonHTMLAttributes<T> {
    popovertarget?: string;
    popovertargetaction?: 'toggle' | 'show' | 'hide';
  }
}
