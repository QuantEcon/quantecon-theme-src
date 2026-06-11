import type { GitMetadata } from './components/PageHeaderHistory';

export interface TemplateOptions {
  hide_toc?: boolean;
  hide_outline?: boolean;
  hide_search?: boolean;
  hide_footer_links?: boolean;
  outline_maxdepth?: number;
  hide_title_block?: boolean;
  /**
   * Page-level override for the "Last changed" header control, normally
   * injected at build time by plugins/git-metadata.mjs (set under `site:` in
   * page frontmatter).
   */
  git_metadata?: GitMetadata;
}
