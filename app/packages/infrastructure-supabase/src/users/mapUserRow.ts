// Row → domain User mapper. Shared by findById / findByHandle.
// The shape mirrors the columns from `users` (see 0001_init_users.sql).
import type { User } from '@kc/domain';

export interface UserRow {
  user_id: string;
  auth_provider: string;
  share_handle: string;
  display_name: string;
  city: string;
  city_name: string;
  profile_street?: string | null;
  profile_street_number?: string | null;
  biography: string | null;
  avatar_url: string | null;
  privacy_mode: string;
  privacy_changed_at: string | null;
  account_status: string;
  onboarding_state: string;
  notification_preferences: unknown;
  is_super_admin: boolean;
  closure_explainer_dismissed: boolean;
  first_post_nudge_dismissed: boolean;
  items_given_count: number;
  items_received_count: number;
  active_posts_count_internal: number;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
}

export function mapUserRow(row: UserRow): User {
  return {
    userId: row.user_id,
    authProvider: row.auth_provider as User['authProvider'],
    shareHandle: row.share_handle,
    displayName: row.display_name,
    city: row.city,
    cityName: row.city_name,
    profileStreet: row.profile_street ?? null,
    profileStreetNumber: row.profile_street_number ?? null,
    biography: row.biography,
    avatarUrl: row.avatar_url,
    privacyMode: row.privacy_mode as User['privacyMode'],
    privacyChangedAt: row.privacy_changed_at,
    accountStatus: row.account_status as User['accountStatus'],
    onboardingState: row.onboarding_state as User['onboardingState'],
    notificationPreferences: row.notification_preferences as User['notificationPreferences'],
    isSuperAdmin: row.is_super_admin,
    closureExplainerDismissed: row.closure_explainer_dismissed,
    firstPostNudgeDismissed: row.first_post_nudge_dismissed,
    itemsGivenCount: row.items_given_count,
    itemsReceivedCount: row.items_received_count,
    activePostsCountInternal: row.active_posts_count_internal,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
