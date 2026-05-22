// Shared canonical tab definitions consumed by both the mobile bottom
// TabBar and the upcoming desktop NavigationRail (Task 9 of FR-RESP-001).
// Keeping a single source of truth here guarantees the two shells stay in
// lockstep on order, routes, labels and iconography.
// Mapped to: SRS §6.1 — 5 tabs (RTL: Profile | Search | Plus | Donations | Home), per D-16.
import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export type TabKey = 'home' | 'donations' | 'create' | 'search' | 'profile';

export type TabDefinition = {
  key: TabKey;
  route: string;
  labelI18nKey: string;
  iconActive: IoniconName;
  iconInactive: IoniconName;
  /** Composer ("+") is a special floating button; rail treats it the same as a labeled tab. */
  isComposer?: boolean;
};

/**
 * Canonical RTL reading order (rightmost = first / "profile").
 * Both TabBar (mobile bottom) and NavigationRail (desktop side) consume this.
 *
 * With dir=rtl on web and I18nManager.isRTL on native, a default `row` lays
 * these out right-to-left, so the array is authored in reading order:
 * Profile (right) | Search | Plus (center) | Donations | Home (left).
 */
export const TABS: readonly TabDefinition[] = [
  {
    key: 'profile',
    route: '/(tabs)/profile',
    labelI18nKey: 'tabs.profile',
    iconActive: 'person',
    iconInactive: 'person-outline',
  },
  {
    key: 'search',
    route: '/(tabs)/search',
    labelI18nKey: 'search.tabLabel',
    iconActive: 'search',
    iconInactive: 'search-outline',
  },
  {
    key: 'create',
    route: '/(tabs)/create',
    labelI18nKey: 'tabs.newPost',
    // Composer uses a single glyph regardless of active state; the special
    // pill rendering is keyed off `isComposer`.
    iconActive: 'add',
    iconInactive: 'add',
    isComposer: true,
  },
  {
    key: 'donations',
    route: '/(tabs)/donations',
    labelI18nKey: 'donations.tabLabel',
    iconActive: 'heart',
    iconInactive: 'heart-outline',
  },
  {
    key: 'home',
    route: '/(tabs)',
    labelI18nKey: 'tabs.home',
    iconActive: 'home',
    iconInactive: 'home-outline',
  },
] as const;
