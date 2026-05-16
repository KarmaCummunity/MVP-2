import { useGlobalSearchParams, useSegments, usePathname } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { parseTruthyQueryParam } from '../lib/query/parseTruthyQueryParam';
import { isAboutMarketingPath } from './aboutMarketingPaths';

const TAB_BAR_HEIGHT = 68;

/** Whether the global shell should render the bottom tab bar + reserve padding. */
export function useShellTabBarVisibility(): boolean {
  const segments = useSegments() as string[];
  const pathname = usePathname() ?? '';
  const params = useGlobalSearchParams<{ hideBottomBar?: string | string[] }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const head = segments[0] as string | undefined;
  const isAuthLanding = head === 'auth' && (segments[1] === 'callback' || segments[1] === 'verify');
  const onAboutSurface = isAboutMarketingPath(pathname);
  const hideBottomBar = onAboutSurface && parseTruthyQueryParam(params.hideBottomBar);

  const base =
    !isLoading &&
    isAuthenticated &&
    head !== '(auth)' &&
    head !== '(guest)' &&
    head !== '(onboarding)' &&
    !isAuthLanding;

  return base && !hideBottomBar;
}

export function shellTabBarHeightPx(visible: boolean): number {
  return visible ? TAB_BAR_HEIGHT : 0;
}
