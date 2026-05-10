// ─────────────────────────────────────────────
// In-memory IUserRepository for use-case tests. Only the methods exercised by
// the onboarding use cases are implemented; the rest throw to flag accidental
// reach-through during tests.
// ─────────────────────────────────────────────

import type { IUserRepository } from '../../ports/IUserRepository';
import type { OnboardingState } from '@kc/domain';

interface Row {
  displayName: string;
  city: string;
  cityName: string;
  onboardingState: OnboardingState;
  avatarUrl?: string | null;
  biography?: string | null;
  closureExplainerDismissed?: boolean;
}

export interface FakeUserRepo extends IUserRepository {
  rows: Map<string, Row>;
}

export function makeFakeUserRepo(seed: Record<string, Row> = {}): FakeUserRepo {
  const rows = new Map(Object.entries(seed));
  const notImpl =
    (name: string) =>
    async (..._args: unknown[]): Promise<never> => {
      throw new Error(`fakeUserRepo: ${name} not implemented`);
    };
  return {
    rows,
    findById: notImpl('findById') as IUserRepository['findById'],
    findByHandle: notImpl('findByHandle') as IUserRepository['findByHandle'],
    create: notImpl('create') as IUserRepository['create'],
    update: notImpl('update') as IUserRepository['update'],
    delete: notImpl('delete') as IUserRepository['delete'],
    follow: notImpl('follow') as IUserRepository['follow'],
    unfollow: notImpl('unfollow') as IUserRepository['unfollow'],
    isFollowing: notImpl('isFollowing') as IUserRepository['isFollowing'],
    getFollowers: notImpl('getFollowers') as IUserRepository['getFollowers'],
    getFollowing: notImpl('getFollowing') as IUserRepository['getFollowing'],
    sendFollowRequest: notImpl('sendFollowRequest') as IUserRepository['sendFollowRequest'],
    acceptFollowRequest: notImpl('acceptFollowRequest') as IUserRepository['acceptFollowRequest'],
    rejectFollowRequest: notImpl('rejectFollowRequest') as IUserRepository['rejectFollowRequest'],
    cancelFollowRequest: notImpl('cancelFollowRequest') as IUserRepository['cancelFollowRequest'],
    getPendingFollowRequests: notImpl(
      'getPendingFollowRequests',
    ) as IUserRepository['getPendingFollowRequests'],
    getPendingFollowRequestsWithUsers: notImpl(
      'getPendingFollowRequestsWithUsers',
    ) as IUserRepository['getPendingFollowRequestsWithUsers'],
    block: notImpl('block') as IUserRepository['block'],
    unblock: notImpl('unblock') as IUserRepository['unblock'],
    getBlockedUsers: notImpl('getBlockedUsers') as IUserRepository['getBlockedUsers'],
    isBlocked: notImpl('isBlocked') as IUserRepository['isBlocked'],
    findByAuthIdentity: notImpl('findByAuthIdentity') as IUserRepository['findByAuthIdentity'],
    createAuthIdentity: notImpl('createAuthIdentity') as IUserRepository['createAuthIdentity'],
    async getOnboardingState(userId) {
      const row = rows.get(userId);
      if (!row) throw new Error(`fakeUserRepo: no row for userId=${userId}`);
      return row.onboardingState;
    },
    async setBasicInfo(userId, { displayName, city, cityName }) {
      const row = rows.get(userId) ?? {
        displayName: '',
        city: '',
        cityName: '',
        onboardingState: 'pending_basic_info' as OnboardingState,
      };
      rows.set(userId, { ...row, displayName, city, cityName });
    },
    async setOnboardingState(userId, state) {
      const row = rows.get(userId) ?? {
        displayName: '',
        city: '',
        cityName: '',
        onboardingState: 'pending_basic_info' as OnboardingState,
      };
      rows.set(userId, { ...row, onboardingState: state });
    },
    async setAvatar(userId, avatarUrl) {
      const row = rows.get(userId) ?? {
        displayName: '',
        city: '',
        cityName: '',
        onboardingState: 'pending_basic_info' as OnboardingState,
      };
      rows.set(userId, { ...row, avatarUrl });
    },
    async setBiography(userId, biography) {
      const row = rows.get(userId) ?? {
        displayName: '',
        city: '',
        cityName: '',
        onboardingState: 'pending_basic_info' as OnboardingState,
      };
      rows.set(userId, { ...row, biography });
    },
    async getEditableProfile(userId) {
      const row = rows.get(userId);
      if (!row) throw new Error(`fakeUserRepo: no row for userId=${userId}`);
      return {
        displayName: row.displayName,
        city: row.city,
        cityName: row.cityName,
        biography: row.biography ?? null,
      };
    },
    async dismissClosureExplainer(userId) {
      const row = rows.get(userId) ?? {
        displayName: '',
        city: '',
        cityName: '',
        onboardingState: 'pending_basic_info' as OnboardingState,
      };
      rows.set(userId, { ...row, closureExplainerDismissed: true });
    },
    searchUsers: notImpl('searchUsers') as IUserRepository['searchUsers'],
    setPrivacyMode: notImpl('setPrivacyMode') as IUserRepository['setPrivacyMode'],
    getFollowStateRaw: notImpl('getFollowStateRaw') as IUserRepository['getFollowStateRaw'],
  };
}
