import { useEffect, useState } from 'react';

/**
 * True only after the component has mounted on the client.
 *
 * Both the server render and the first (hydrating) client render return
 * `false`, so the markup matches and React does not warn; the effect then
 * flips it on the frame after hydration.
 *
 * Used to withhold CSS transitions until the stylesheet has landed. On a static
 * build the first paint happens before `app.css` applies, so any state the
 * stylesheet then corrects — an `opacity-0`, a `-translate-x-full` — would
 * *animate* into place if the `transition-*` class predated it. Gating the
 * transition on this makes that correction instant, and reserves the animation
 * for genuine, post-hydration state changes.
 */
const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
};

export default useMounted;
