import { useBaseurl, useLinkProvider, withBaseurl } from '@myst-theme/providers';
import { useHeaders } from '@myst-theme/site';
import classNames from 'classnames';
import useMounted from '~/hooks/useMounted';
import useScroll from '~/hooks/useScroll';

export function BackToTop() {
  const isScrolled = useScroll(80);
  const mounted = useMounted();
  const Link = useLinkProvider();
  return (
    <div className="fixed bottom-0 left-0 right-0 col-screen not-prose simple-center-grid grid-gap">
      <div className="relative col-margin">
        <p
          className={classNames(
            'absolute bottom-0 font-semibold text-md z-[1000]',
            // Withheld until after mount: before app.css lands `opacity-0` does
            // not exist, so this paints visible and would then *fade* out when
            // the stylesheet arrives rather than simply never having been
            // there. Same mechanism as ContentsSidebar and SidebarToggle.
            mounted && 'transition-opacity ease-in-out duration-300',
            {
              'opacity-100': isScrolled,
              'opacity-0': !isScrolled,
            }
          )}
        >
          <Link to="#top">Back to top</Link>
        </p>
      </div>
    </div>
  );
}

export function Outline({
  containerClassName,
  innerClassName,
  pageEnumerator,
}: {
  containerClassName?: string;
  innerClassName?: string;
  pageEnumerator?: string;
}) {
  const Link = useLinkProvider();
  const baseurl = useBaseurl();
  const { headings } = useHeaders('main h2', 3);
  return (
    <div className={classNames('relative self-start', containerClassName)}>
      <nav
        className={classNames(
          'absolute inset-0 not-prose space-y-6 text-opacity-80 dark:font-semibold',
          innerClassName
        )}
      >
        {headings.length > 0 && (
          <>
            <p className="mb-4 text-lg font-bold text-opacity-100 dark:text-qetext-dark">
              On this page
            </p>
            <ul className="space-y-2 font-light not-prose">
              {headings.map((h, i) => (
                <li key={`outline-li-${h.id}`}>
                  <Link to={`#${h.id}`}>
                    {pageEnumerator ? `${pageEnumerator}.${i + 1}. ${h.title}` : h.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div>
          <img
            className="dark:hidden"
            src={withBaseurl('/logos/qe-logo.png', baseurl)}
            alt="QuantEcon Logo"
            width={150}
          />
          <img
            className="hidden dark:block"
            src={withBaseurl('/logos/quantecon-logo-transparent.png', baseurl)}
            alt="QuantEcon Logo (dark-mode)"
            width={150}
          />
        </div>
        <p className="text-sm">
          Powered by <a href="https://mystmd.org">MyST Markdown</a>
        </p>
      </nav>
    </div>
  );
}
