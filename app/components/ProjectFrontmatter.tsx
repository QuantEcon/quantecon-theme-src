import classNames from 'classnames';
import { Author } from '@myst-theme/frontmatter';
import type { Affiliation, Contributor } from 'myst-frontmatter';
import React from 'react';
import { useBaseurl, useLinkProvider } from '@myst-theme/providers';
import { PageHeaderHistory } from './PageHeaderHistory';

export function ProjectFrontmatter({
  className,
  projectTitle,
  pageTitle,
  authors,
  affiliations,
}: {
  className?: string;
  projectTitle: string;
  pageTitle?: string;
  authors?: Contributor[];
  affiliations?: Affiliation[];
}) {
  const baseurl = useBaseurl();
  const Link = useLinkProvider();
  return (
    <div
      className={classNames(
        // When the changelog is open its panel is the last thing in this
        // block, and the bottom padding is dropped so the blue divider becomes
        // the panel's own bottom edge (the tidier "integrated" look of the
        // Sphinx book-theme header, keeping the blue on the bottom).
        `col-body border-b-[5px] border-b-qeborder-blue space-y-1
         pb-4 has-[[data-qe-history-panel]]:pb-0`,
        className
      )}
    >
      <div className="space-x-4">
        <div
          aria-label="Book title"
          className={classNames('block font-bold lg:inline prose-a:text-inherit', {
            'text-lg': pageTitle,
            'text-4xl': !pageTitle,
          })}
        >
          <Link to={baseurl ?? '/'}>{projectTitle}</Link>
        </div>
        {pageTitle && (
          <div className="block text-lg lg:inline" aria-label="Page title">
            {pageTitle}
          </div>
        )}
      </div>
      {/* Authors on the left, the "Last changed" control aligned to the right
          on the same row (more semantic, saves a header line); it wraps below
          authors on narrow viewports. PageHeaderHistory is `display: contents`,
          so its trigger right-aligns itself here and its expanded changelog
          wraps onto a full-width line underneath — still inside this bordered
          block, so opening it pushes the blue divider down. `empty:hidden`
          keeps pages with neither authors nor git metadata from gaining a row. */}
      <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap empty:hidden">
        {authors && (
          <div aria-label="Author names and links">
            {authors.reduce<React.ReactNode>((acc, a, i, authors) => {
              let chunk: React.ReactNode = a.name;
              if (a.url) {
                chunk = (
                  <Author
                    className="text-[102%] font-[400] text-sky-500"
                    author={a}
                    affiliations={affiliations}
                  />
                );
              }
              if (i > 0 && i < authors.length - 1) {
                chunk = <>, {chunk}</>;
              } else if (i === authors.length - 1 && authors.length > 1) {
                chunk = <> and {chunk}</>;
              }
              return (
                <span key={a.id ?? a.name ?? i}>
                  {acc}
                  {chunk}
                </span>
              );
            }, '')}
          </div>
        )}
        <PageHeaderHistory />
      </div>
    </div>
  );
}
