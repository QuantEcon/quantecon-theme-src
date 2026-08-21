import classNames from 'classnames';
import { LoadingBar } from '@myst-theme/site';
import { Search } from '@myst-theme/site/src/components/Navigation/Search';
import { House } from 'lucide-react';
import { SidebarToggle } from './SidebarToggle';
import { QuantEconButton } from './QuantEconButton';
import { ThemeButton } from './ThemeButton';
import { DownloadsButton } from './DownloadButton';
import { GitHubButton } from './GitHubButton';
import { LaunchButton } from './LaunchButton';
import { FullScreenButton } from './FullscreenButton';
import { FontScaleListItems } from './FontScaleListItems';
import { Tooltip } from './Tooltip';
import { MobileActionsMenu } from './MobileActionsMenu';
import { useBaseurl, useLinkProvider } from '@myst-theme/providers';

export function Toolbar() {
  const Link = useLinkProvider();
  const baseurl = useBaseurl();
  const iconSize = 20;
  return (
    <div
      className={classNames(
        'fixed top-0 left-0 right-0 z-[2] flex items-center justify-between h-[50px] px-3 lg:px-6',
        'bg-qetoolbar-light dark:bg-qetoolbar-dark',
        'border-b-[1px] border-qetoolbar-border'
      )}
    >
      {/*
        The gap and the container padding above both widen at `lg`, not at
        `md`, for the same reason. Every desktop control appears at
        `md` (768px), but at 20px spacing the row's intrinsic width is ~856px,
        so between 768 and 856 it had nowhere to go and pushed the last icons
        off the right edge. Thirteen gaps at 12px instead of 20px gives that
        band ~104px back, which is enough for the full set plus the compute
        toggle. Above `lg` there is room to breathe, so the spacing returns.
      */}
      <ul className="flex items-center w-full space-x-3 lg:space-x-5 text-qetext-light dark:text-qetext-dark">
        <li>
          <SidebarToggle />
        </li>
        <li>
          <Link to={baseurl ?? '/'}>
            <Tooltip label="Home">
              <House className="opacity-90 hover:scale-110" width={iconSize} height={iconSize} />
            </Tooltip>
          </Link>
        </li>
        {/*
          `shrink-0` is load-bearing. The logo is an <img> with a fixed height
          and an auto width, and Tailwind's preflight gives every image
          `max-width: 100%`. As a flex item this <li> shrinks once the toolbar
          runs out of room, the image clamps to it, and the pinned height then
          distorts the aspect ratio — visibly between roughly 770px and 840px,
          the band above the `md` breakpoint where every desktop control is
          still shown. The flexible space in the row is the spacer below.
        */}
        <li className="shrink-0">
          <QuantEconButton />
        </li>
        <li className="flex-grow" />
        <li>
          <Search />
        </li>
        <li className="hidden md:block">
          <FullScreenButton size={iconSize} />
        </li>
        <FontScaleListItems className="hidden md:block" size={iconSize} />
        {/* Separator between the view controls and the actions cluster; scaled
            down in the narrow desktop band for the same reason as the gap. */}
        <li className="flex items-center md:pr-4 lg:pr-[36px]">
          <ThemeButton className="w-5 h-5 opacity-60" />
        </li>
        <li className="hidden md:block">
          <DownloadsButton size={iconSize} />
        </li>
        {/* Portal target for the live-compute toggle (see ComputeToolbarSlot).
            `empty:hidden` keeps it from adding a gap on non-notebook pages. */}
        <li id="qe-compute-slot" className="hidden md:flex items-center empty:hidden" />
        <li className="hidden md:block">
          <LaunchButton size={iconSize} />
        </li>
        <li className="hidden md:block">
          <GitHubButton sizeClasses="w-5 h-5" />
        </li>
        <li className="block md:hidden">
          <MobileActionsMenu sizeClasses="w-5 h-5" size={iconSize} />
        </li>
      </ul>
      <LoadingBar />
    </div>
  );
}
