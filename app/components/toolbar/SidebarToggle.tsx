import { Menu, X } from 'lucide-react';
import { TOC_POPOVER_ID } from '../contentsDrawer';

/**
 * Opens the contents drawer.
 *
 * No `onClick` and no React state by design — `popovertarget` hands the toggle
 * to the browser, which also supplies `aria-expanded`, Escape and light
 * dismiss. Don't add any of those here.
 *
 * Both icons are `aria-hidden` so the button is the single accessible name;
 * which one shows is decided in CSS from the drawer's `:popover-open` state
 * (`.qe-toc-toggle__*` in styles/app.css). Browsers without the Popover API
 * hide this button along with the drawer — see the `@supports` block there.
 */
export function SidebarToggle() {
  return (
    <button
      type="button"
      popovertarget={TOC_POPOVER_ID}
      aria-label="Table of contents"
      className="qe-toc-toggle flex items-center w-6 h-6 cursor-pointer opacity-90 transition-transform duration-300 ease-in-out hover:scale-110"
    >
      <Menu className="qe-toc-toggle__open" width={24} height={24} aria-hidden="true" />
      <X className="qe-toc-toggle__close" width={24} height={24} aria-hidden="true" />
    </button>
  );
}
