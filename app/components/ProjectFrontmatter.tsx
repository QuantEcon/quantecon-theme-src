import classNames from 'classnames';
import { Author } from '@myst-theme/frontmatter';
import type { Affiliation, Contributor } from 'myst-frontmatter';
import React from 'react';
import { useBaseurl, useLinkProvider } from '@myst-theme/providers';

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
        'col-body border-b-[5px] border-b-qeborder-blue space-y-1 pb-4',
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
    </div>
  );
}
