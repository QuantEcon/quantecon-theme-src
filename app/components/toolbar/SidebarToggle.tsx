import { Menu, X } from 'lucide-react';
import { TOC_POPOVER_ID } from '../contentsDrawer';

/**
 * Opens the contents drawer.
 *
 * Deliberately has no `onClick` and no React state: `popovertarget` makes the
 * browser own the toggle, which means the control works before hydration and
 * cannot fall out of sync with the panel. The browser also exposes the
 * button's expanded state to assistive technology (verified: the accessibility
 * tree reports expanded false -> true across a toggle), so no `aria-expanded`
 * is needed here, and it supplies Escape and click-outside dismissal.
 *
 * The hamburger/cross swap is done in CSS off the drawer's own `:popover-open`
 * state (see `.qe-toc-toggle__*` in styles/app.css), so the icon cannot desync
 * from the panel. Both icons are `aria-hidden`: the button carries the single
 * accessible name, where previously each icon carried its own label and screen
 * readers could announce both "Show" and "Hide" for the one control.
 *
 * On browsers without the Popover API this button is hidden along with the
 * drawer, so it is never presented as a control that does nothing — see the
 * `@supports` block at the end of the drawer styles.
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
