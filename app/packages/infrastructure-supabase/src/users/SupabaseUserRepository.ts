// ─────────────────────────────────────────────
// SupabaseUserRepository — adapter for IUserRepository.
// Slice A (P0.3): only onboarding read/write methods are wired. The remaining
// methods throw `not_implemented` and will be filled in by P0.4 / P1.1 / P2.4.
// docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md
// ─────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUserRepository } from '@kc/application';
import type { OnboardingState, User } from '@kc/domain';
import { mapUserRow, type UserRow } from './mapUserRow';

const NOT_IMPL = (name: string, slice: string) =>
  new Error(`SupabaseUserRepository.${name}: not_implemented (${slice})`);

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly client: SupabaseClient) {}

  // ── Onboarding (P0.3 slice A) ────────────────────────────────────────────

  async getOnboardingState(userId: string): Promise<OnboardingState> {
    const { data, error } = await this.client
      .from('users')
      .select('onboarding_state')
      .eq('user_id', userId)
      .single();
    if (error) throw new Error(`getOnboardingState: ${error.message}`);
    const state = (data as { onboarding_state: OnboardingState } | null)?.onboarding_state;
    if (!state) throw new Error('getOnboardingState: no row');
    return state;
  }

  async setBasicInfo(
    userId: string,
    params: { displayName: string; city: string; cityName: string },
  ): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({
        display_name: params.displayName,
        city: params.city,
        city_name: params.cityName,
      })
      .eq('user_id', userId);
    if (error) throw new Error(`setBasicInfo: ${error.message}`);
  }

  async setOnboardingState(userId: string, state: OnboardingState): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ onboarding_state: state })
      .eq('user_id', userId);
    if (error) throw new Error(`setOnboardingState: ${error.message}`);
  }

  async setAvatar(userId: string, avatarUrl: string | null): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', userId);
    if (error) throw new Error(`setAvatar: ${error.message}`);
  }

  async setBiography(userId: string, biography: string | null): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ biography })
      .eq('user_id', userId);
    if (error) throw new Error(`setBiography: ${error.message}`);
  }

  /** FR-CLOSURE-004 AC3 — flips users.closure_explainer_dismissed = true. */
  async dismissClosureExplainer(userId: string): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ closure_explainer_dismissed: true })
      .eq('user_id', userId);
    if (error) throw new Error(`dismissClosureExplainer: ${error.message}`);
  }

  async getEditableProfile(userId: string): Promise<{
    displayName: string;
    city: string;
    cityName: string;
    biography: string | null;
  }> {
    const { data, error } = await this.client
      .from('users')
      .select('display_name, city, city_name, biography')
      .eq('user_id', userId)
      .single();
    if (error) throw new Error(`getEditableProfile: ${error.message}`);
    if (!data) throw new Error('getEditableProfile: no row');
    const row = data as {
      display_name: string;
      city: string;
      city_name: string;
      biography: string | null;
    };
    return {
      displayName: row.display_name,
      city: row.city,
      cityName: row.city_name,
      biography: row.biography,
    };
  }

  // ── Methods deferred to later slices ─────────────────────────────────────

  async findById(userId: string): Promise<User | null> {
    return this.fetchUserBy('user_id', userId);
  }
  async findByHandle(handle: string): Promise<User | null> {
    return this.fetchUserBy('share_handle', handle);
  }

  /** Shared helper: SELECT * FROM users WHERE <col> = <value>, mapped to domain. */
  private async fetchUserBy(
    column: 'user_id' | 'share_handle',
    value: string,
  ): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq(column, value)
      .maybeSingle();
    if (error) throw new Error(`fetchUserBy(${column}): ${error.message}`);
    if (!data) return null;
    return mapUserRow(data as unknown as UserRow);
  }
  async create(): Promise<never> {
    throw NOT_IMPL('create', 'auto-created by handle_new_user trigger');
  }
  async update(): Promise<never> {
    throw NOT_IMPL('update', 'P2.4');
  }
  async delete(_userId: string): Promise<void> {
    throw NOT_IMPL('delete', 'P2.2');
  }
  async follow(): Promise<never> {
    throw NOT_IMPL('follow', 'P1.1');
  }
  async unfollow(_followerId: string, _followedId: string): Promise<void> {
    throw NOT_IMPL('unfollow', 'P1.1');
  }
  async isFollowing(_followerId: string, _followedId: string): Promise<boolean> {
    throw NOT_IMPL('isFollowing', 'P1.1');
  }
  async getFollowers(): Promise<never> {
    throw NOT_IMPL('getFollowers', 'P1.1');
  }
  async getFollowing(): Promise<never> {
    throw NOT_IMPL('getFollowing', 'P1.1');
  }
  async sendFollowRequest(): Promise<never> {
    throw NOT_IMPL('sendFollowRequest', 'P1.1');
  }
  async acceptFollowRequest(_requesterId: string, _targetId: string): Promise<void> {
    throw NOT_IMPL('acceptFollowRequest', 'P1.1');
  }
  async rejectFollowRequest(_requesterId: string, _targetId: string): Promise<void> {
    throw NOT_IMPL('rejectFollowRequest', 'P1.1');
  }
  async cancelFollowRequest(_requesterId: string, _targetId: string): Promise<void> {
    throw NOT_IMPL('cancelFollowRequest', 'P1.1');
  }
  async getPendingFollowRequests(): Promise<never> {
    throw NOT_IMPL('getPendingFollowRequests', 'P1.1');
  }
  async block(): Promise<never> {
    throw NOT_IMPL('block', 'P1.4');
  }
  async unblock(_blockerId: string, _blockedId: string): Promise<void> {
    throw NOT_IMPL('unblock', 'P1.4');
  }
  /**
   * Returns the users this caller has blocked. RLS on `public.blocks` is
   * `auth.uid() = blocker_id` for SELECT, which matches our query (no need
   * for SECURITY DEFINER). Used by FR-CLOSURE-003 to filter the recipient
   * picker, by future FR-FEED-* visibility helpers, and the Blocked Users
   * settings screen (P1.4 — read path is here, the toggle lives in P1.4).
   */
  async getBlockedUsers(userId: string): Promise<User[]> {
    const { data, error } = await this.client
      .from('blocks')
      .select('blocked:blocked_id(*)')
      .eq('blocker_id', userId);
    if (error) throw new Error(`getBlockedUsers: ${error.message}`);
    return ((data ?? []) as unknown as { blocked: UserRow | null }[])
      .map((r) => r.blocked)
      .filter((u): u is UserRow => u !== null)
      .map(mapUserRow);
  }
  async isBlocked(_blockerId: string, _blockedId: string): Promise<boolean> {
    throw NOT_IMPL('isBlocked', 'P1.4');
  }
  async findByAuthIdentity(_provider: string, _subject: string): Promise<never> {
    throw NOT_IMPL('findByAuthIdentity', 'P0.4');
  }
  async createAuthIdentity(): Promise<never> {
    throw NOT_IMPL('createAuthIdentity', 'auto-created by handle_new_user trigger');
  }
}
