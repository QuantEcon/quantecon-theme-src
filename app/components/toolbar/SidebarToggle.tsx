import { useNavOpen } from '@myst-theme/providers';
import classNames from 'classnames';
import { Menu, X } from 'lucide-react';
import useMounted from '~/hooks/useMounted';

export function SidebarToggle() {
  const [open, setOpen] = useNavOpen();
  const mounted = useMounted();

  // Both icons are always rendered, stacked by `absolute` and cross-faded by
  // opacity.
  //
  // The transition is withheld until after mount for the same reason as the
  // panel this button drives (see ContentsSidebar.tsx). On a static build the
  // first paint happens before app.css applies, so neither `absolute` nor
  // `opacity-0` exists yet and both icons paint in flow at full opacity —
  // lucide emits real width/height attributes, so they have size without any
  // CSS. When app.css lands `position` snaps, since it is not animatable, but
  // `opacity` 1 → 0 would *animate*: a close icon fading out of the toolbar on
  // every navigation. Withholding the transition until mount makes that
  // correction instant and leaves the cross-fade for real clicks.
  //
  // Narrowed from `transition-all`, which animated every property app.css
  // changes on that frame. The three named here are the ones that were ever
  // meant to move: opacity for the cross-fade, transform for `hover:scale-110`,
  // and colour so the icons still ease across a dark-mode toggle.
  const iconClasses = (visible: boolean) =>
    classNames('absolute hover:scale-110', mounted && 'transition-[opacity,transform,color] duration-300 ease-in-out', {
      'opacity-100': visible,
      'opacity-0': !visible,
    });

  return (
    <button
      className="relative flex items-center w-6 h-6 cursor-pointer opacity-90"
      onClick={() => setOpen(!open)}
    >
      <X
        className={iconClasses(open)}
        width={24}
        height={24}
        aria-label="Hide table of contents"
      />
      <Menu
        className={iconClasses(!open)}
        width={24}
        height={24}
        aria-label="Show table of contents"
      />
    </button>
  );
}
