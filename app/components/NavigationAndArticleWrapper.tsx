import {
  BannerStateProvider,
  TabStateProvider,
  UiStateProvider,
  useThemeTop,
} from '@myst-theme/providers';
import { Toolbar } from './toolbar/Toolbar';
import { ContentsSidebar } from './ContentsSidebar';

function NavigationAndArticleWrapperInternal({
  children,
  inset = 20, // begin text 20px from the top (aligned with menu)
}: {
  hide_toc?: boolean;
  hideSearch?: boolean;
  children: React.ReactNode;
  inset?: number;
}) {
  const top = useThemeTop();
  // `useSidebarHeight` was dropped here and in ContentsSidebar: it sizes the
  // sidebar against a banner, and it bails unless the same call site holds both
  // its refs. Each of ours attached only one, so both instances early-returned
  // on every scroll event and did nothing. The drawer is sized in CSS instead.
  return (
    <>
      <Toolbar />
      <ContentsSidebar />
      <TabStateProvider>
        <article className="article content" style={{ marginTop: top }}>
          {children}
        </article>
      </TabStateProvider>
    </>
  );
}

export function NavigationAndArticleWrapper({
  children,
  hide_toc,
  hideSearch,
  inset = 20, // begin text 20px from the top (aligned with menu)
}: {
  hide_toc?: boolean;
  hideSearch?: boolean;
  children: React.ReactNode;
  inset?: number;
}) {
  return (
    <UiStateProvider>
      <BannerStateProvider>
        <NavigationAndArticleWrapperInternal
          children={children}
          hide_toc={hide_toc}
          hideSearch={hideSearch}
          inset={inset}
        />
      </BannerStateProvider>
    </UiStateProvider>
  );
}
