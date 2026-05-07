// ─────────────────────────────────────────────
// SupabaseUserRepository — adapter for IUserRepository.
// Slice A (P0.3): only onboarding read/write methods are wired. The remaining
// methods throw `not_implemented` and will be filled in by P0.4 / P1.1 / P2.4.
// docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md
// ─────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUserRepository } from '@kc/application';
import type { OnboardingState } from '@kc/domain';

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

  // ── Methods deferred to later slices ─────────────────────────────────────

  async findById(_userId: string): Promise<never> {
    throw NOT_IMPL('findById', 'P0.4');
  }
  async findByHandle(_handle: string): Promise<never> {
    throw NOT_IMPL('findByHandle', 'P2.4');
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
  async getBlockedUsers(): Promise<never> {
    throw NOT_IMPL('getBlockedUsers', 'P1.4');
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
