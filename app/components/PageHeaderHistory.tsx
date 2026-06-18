import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, X } from "lucide-react";
import React from "react";
import { usePage } from "./PageProvider";

export interface GitChangelogEntry {
  hash: string;
  short_hash: string;
  author: string;
  date: string;
  message: string;
}

export interface GitMetadata {
  last_modified?: string;
  changelog?: GitChangelogEntry[];
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  // Pin the timezone so the server render, client hydration, and visual
  // snapshots agree on the date regardless of host timezone.
  timeZone: "UTC",
});

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE_FORMAT.format(date);
}

function relativeTime(iso: string, now: number) {
  const seconds = (now - new Date(iso).getTime()) / 1000;
  if (Number.isNaN(seconds) || seconds < 60) return "just now";
  const units: [number, string][] = [
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2592000, "week"],
    [31536000, "month"],
    [Infinity, "year"],
  ];
  let size = 60;
  for (const [limit, label] of units) {
    if (seconds < limit) {
      const count = Math.floor(seconds / size);
      return `${count} ${label}${count !== 1 ? "s" : ""} ago`;
    }
    size = limit;
  }
}

/**
 * "Last changed" page-header control that opens a centred changelog modal,
 * mirroring the quantecon-book-theme header. A modal (rather than an anchored
 * popover) keeps the changelog clear of the left/right page menus and centres
 * cleanly on mobile.
 *
 * Data sources, in order of precedence:
 *  1. `site.git_metadata` in the page frontmatter (manual override, and how
 *     the visual fixture pins deterministic data), then
 *  2. `mdast.data.git_metadata` injected at build time by
 *     plugins/git-metadata.mjs.
 *
 * Renders nothing when neither is present.
 */
export function PageHeaderHistory() {
  const page = usePage();
  // Relative times depend on the clock; render absolute dates on the server
  // and only switch after mount so statically exported HTML hydrates cleanly.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => setNow(Date.now()), []);

  const frontmatter = page?.frontmatter as any;
  const meta: GitMetadata | undefined =
    frontmatter?.site?.git_metadata ?? (page?.mdast as any)?.data?.git_metadata;
  const changelog = meta?.changelog ?? [];
  const lastModified = meta?.last_modified ?? changelog[0]?.date;
  if (!lastModified) return null;

  // Commit links target the source repository itself, so unlike
  // LaunchButton's notebook URLs the `.myst` suffix must be kept.
  const github: string | undefined = frontmatter?.github;
  const repoUrl = github?.startsWith("https://github.com/")
    ? github.replace(/\/$/, "")
    : undefined;
  // mystmd computes `source_url` as {repo}/blob/{branch}/{path}; only a URL of
  // that shape can be rewritten into a commits view.
  const sourceUrl = frontmatter?.source_url as string | undefined;
  const historyUrl = sourceUrl?.includes("/blob/")
    ? sourceUrl.replace("/blob/", "/commits/")
    : undefined;

  // Without changelog entries there is nothing to expand — render plain text,
  // not a non-functional interactive control.
  if (changelog.length === 0) {
    return (
      <div className="text-sm text-qetext-light/70 dark:text-qetext-dark-muted">
        Last changed: {formatDate(lastModified)}
      </div>
    );
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="group flex items-center gap-1 text-sm cursor-pointer
          text-qetext-light/70 dark:text-qetext-dark-muted
          hover:text-qeborder-blue dark:hover:text-qeborder-blue"
      >
        Last changed: {formatDate(lastModified)}
        <ChevronDown
          size={14}
          aria-hidden
          className="transition-transform group-data-[state=open]:rotate-180"
        />
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* Dim backdrop so the centred modal stands out across browsers
            (Chrome lacks Safari's default dialog outline) and reads clearly
            over the left/right page menus. */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`
              fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
              w-[440px] max-w-[90vw] rounded
              border border-qeborder-blue
              bg-white dark:bg-qepage-dark p-4
              text-qetext-light dark:text-qetext-dark
              shadow-lg focus:outline-none
              `}
        >
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-qetoolbar-border">
            <Dialog.Title className="text-base font-medium">
              Changelog
            </Dialog.Title>
            <div className="flex items-center gap-3">
              {historyUrl && (
                <a
                  href={historyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-qeborder-blue hover:underline"
                >
                  full history
                </a>
              )}
              <Dialog.Close
                aria-label="Close"
                className="text-qetext-light/60 dark:text-qetext-dark-muted
                  hover:text-qeborder-blue cursor-pointer"
              >
                <X size={16} aria-hidden />
              </Dialog.Close>
            </div>
          </div>
          <ol
            className="m-0 p-0 list-none max-h-80 overflow-y-auto"
            aria-label="Recent changes"
          >
            {changelog.map((entry) => (
              <li
                key={entry.hash}
                className="py-1.5 border-b border-qetoolbar-border/50 last:border-b-0"
              >
                <div className="flex items-baseline gap-2">
                  {repoUrl ? (
                    <a
                      href={`${repoUrl}/commit/${entry.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-qeborder-blue hover:underline"
                    >
                      {entry.short_hash}
                    </a>
                  ) : (
                    <span className="font-mono text-xs opacity-70">
                      {entry.short_hash}
                    </span>
                  )}
                  <span
                    className="flex-1 text-sm truncate"
                    title={entry.message}
                  >
                    {entry.message}
                  </span>
                </div>
                <div className="flex gap-1 text-xs opacity-70">
                  <span>{entry.author}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {now
                      ? relativeTime(entry.date, now)
                      : formatDate(entry.date)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
