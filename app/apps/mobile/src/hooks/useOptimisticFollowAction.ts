// app/apps/mobile/src/hooks/useOptimisticFollowAction.ts
// FR-FOLLOW-001 AC4 / FR-FOLLOW-006 AC3 — optimistic follow-state dispatcher
// with snapshot+rollback on error and days-remaining toast for cooldown.
// Extracted from /user/[handle]/index.tsx (TD-125 + TD-126).

import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { isFollowError, type FollowState, type FollowStateInfo } from '@kc/application';
import type { User } from '@kc/domain';
import {
  getFollowUserUseCase,
  getUnfollowUserUseCase,
  getSendFollowRequestUseCase,
  getCancelFollowRequestUseCase,
} from '../services/followComposition';

export type FollowAction = 'follow' | 'unfollow' | 'send' | 'cancel';

export interface UseOptimisticFollowActionParams {
  viewerId: string | undefined;
  target: User;
  /** The `handle` route param used as the cache key of `['profile-other', handle]`. */
  handle: string;
}

export function useOptimisticFollowAction({ viewerId, target, handle }: UseOptimisticFollowActionParams) {
  const qc = useQueryClient();

  return async (action: FollowAction): Promise<void> => {
    if (!viewerId) return;
    const followStateKey = ['follow-state', viewerId, target.userId] as const;
    const profileOtherKey = ['profile-other', handle] as const;
    const prevFollowState = qc.getQueryData<FollowStateInfo>(followStateKey);
    const prevUser = qc.getQueryData<User | null>(profileOtherKey);

    const nextState: FollowState =
      action === 'follow' ? 'following'
      : action === 'unfollow' ? (target.privacyMode === 'Private' ? 'not_following_private_no_request' : 'not_following_public')
      : action === 'send' ? 'request_pending'
      : 'not_following_private_no_request';
    const countDelta = action === 'follow' ? 1 : action === 'unfollow' ? -1 : 0;

    qc.setQueryData<FollowStateInfo>(followStateKey, { state: nextState });
    if (countDelta !== 0 && prevUser) {
      qc.setQueryData<User | null>(profileOtherKey, {
        ...prevUser,
        followersCount: Math.max(0, prevUser.followersCount + countDelta),
      });
    }

    try {
      if (action === 'follow') await getFollowUserUseCase().execute({ viewerId, targetUserId: target.userId });
      else if (action === 'unfollow') await getUnfollowUserUseCase().execute({ viewerId, targetUserId: target.userId });
      else if (action === 'send') await getSendFollowRequestUseCase().execute({ viewerId, targetUserId: target.userId });
      else await getCancelFollowRequestUseCase().execute({ viewerId, targetUserId: target.userId });
      qc.invalidateQueries({ queryKey: followStateKey });
      qc.invalidateQueries({ queryKey: profileOtherKey });
      qc.invalidateQueries({ queryKey: ['user-profile', viewerId] });
    } catch (err) {
      qc.setQueryData(followStateKey, prevFollowState);
      qc.setQueryData(profileOtherKey, prevUser);
      if (isFollowError(err) && err.code === 'cooldown_active') {
        const days = err.cooldownUntil ? Math.max(0, Math.ceil(
          (new Date(err.cooldownUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )) : 0;
        Alert.alert('לא ניתן לשלוח כרגע', `ניתן לשלוח שוב בעוד ${days} ימים.`);
      } else {
        Alert.alert('שגיאה', 'הפעולה נכשלה. נסו שוב.');
      }
    }
  };
}
