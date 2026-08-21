import type { Heading } from '@myst-theme/common';
import { getProjectHeadings } from '@myst-theme/common';
import {
  useBaseurl,
  useLinkProvider,
  useProjectManifest,
  useSiteManifest,
  withBaseurl,
} from '@myst-theme/providers';
import { slugToUrl } from 'myst-common';
import { TOC_HEADING_ID, TOC_POPOVER_ID } from './contentsDrawer';

type StrictHeading = Omit<Heading, 'level'> & { level: number };
type HeadingGroup = StrictHeading[];

function Section({ group }: { group: HeadingGroup }) {
  const baseurl = useBaseurl();
  const Link = useLinkProvider();
  return (
    <ul>
      {group.map((heading) => (
        <li
          className="my-[6px] font-light text-qetext-light dark:text-qetext-dark opacity-80 dark:bg-opacity-100"
          key={heading.slug ?? heading.title}
        >
          {heading.slug ? (
            <Link to={withBaseurl(`/${slugToUrl(heading.slug)}`, baseurl)}>
              {heading.enumerator ? `${heading.enumerator}. ` : ''}
              {heading.title}
            </Link>
          ) : (
            <span>
              {heading.enumerator ? `${heading.enumerator}. ` : ''}
              {heading.title}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ContentsSidebar() {
  const config = useSiteManifest();
  const project = useProjectManifest();
  const baseurl = useBaseurl();
  const Link = useLinkProvider();

  if (!config) return null;

  const contents = getProjectHeadings(config, project?.slug, {
    addGroups: false,
  });

  const headings = (contents ?? [])
    ?.filter((heading): heading is StrictHeading => heading.level !== 'index')
    .filter((heading) => heading.level < 3)
    .reduce<(StrictHeading | HeadingGroup)[]>(
      (acc, heading, idx) => {
        if (idx === 0) {
          return [heading];
        } else if (heading.level === 1) {
          return [...acc, heading];
        }
        const last = acc[acc.length - 1];
        const item = heading;
        if (Array.isArray(last)) {
          last.push(item);
          return acc;
        } else {
          return [...acc, [item]];
        }
      },
      [] as (StrictHeading | HeadingGroup)[]
    );

  return (
    // A popover, so the browser keeps it hidden until the toggle invokes it —
    // including on the first paint, before app.css has loaded. All of the
    // presentation lives in `.qe-toc` (styles/app.css); there is no open/closed
    // state in React, so the drawer works before hydration and cannot animate a
    // correction on arrival. See styles/app.css for the full rationale.
    <div id={TOC_POPOVER_ID} popover="auto" className="qe-toc">
      <h2 id={TOC_HEADING_ID} className="mb-4 text-lg font-bold">
        Contents
      </h2>
      {/* Labelled by the heading rather than a second `aria-label`: the button
          that opens this is already named "Table of contents", so a matching
          label here had screen readers announce the same phrase twice. */}
      <nav aria-labelledby={TOC_HEADING_ID}>
        {headings?.map((headingOrGroup) => {
          if (Array.isArray(headingOrGroup))
            return (
              <Section
                key={headingOrGroup[0].slug ?? headingOrGroup[0].title}
                group={headingOrGroup}
              />
            );
          // A top-level entry with a slug is a real page (e.g. a flat TOC) and
          // must be navigable; without one it is a pure grouping title.
          return (
            <p
              className="mt-5 mb-4 text-lg font-semibold text-qetext-light dark:text-qetext-dark"
              key={headingOrGroup.slug ?? headingOrGroup.title}
            >
              {headingOrGroup.slug ? (
                <Link to={withBaseurl(`/${slugToUrl(headingOrGroup.slug)}`, baseurl)}>
                  {headingOrGroup.title}
                </Link>
              ) : (
                headingOrGroup.title
              )}
            </p>
          );
        })}
      </nav>
    </div>
  );
}
