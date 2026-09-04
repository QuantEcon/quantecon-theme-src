import classNames from 'classnames';
import { LoadingBar } from '@myst-theme/site';
import { Search } from './Search';
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
        'fixed top-0 left-0 right-0 z-[2] flex items-center justify-between h-[50px] px-3 md:px-6',
        'bg-qetoolbar-light dark:bg-qetoolbar-dark',
        'border-b-[1px] border-qetoolbar-border'
      )}
    >
      <ul className="flex items-center w-full space-x-3 md:space-x-5 text-qetext-light dark:text-qetext-dark">
        <li>
          <SidebarToggle />
        </li>
        <li>
          <Tooltip label="Home" asChild>
            <Link to={baseurl ?? '/'} aria-label="Home">
              <House className="opacity-90 hover:scale-110" width={iconSize} height={iconSize} />
            </Link>
          </Tooltip>
        </li>
        <li>
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
        <li className="flex items-center md:pr-[36px]">
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
