import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { ProfilePostOwnerContext } from '../lib/postWithOwnerFromPost';
import { profilePostOwnerFromUser } from '../lib/profilePostOwnerContext';
import { useAuthStore } from '../store/authStore';
import { getUserRepo } from '../services/userComposition';

/** Owner context for feed-style cards on the signed-in user's profile grids. */
export function useMyProfilePostOwner(): ProfilePostOwnerContext | undefined {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.userId);
  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000, // PERF-3: profile (self) — edit-profile invalidates explicitly
  });
  return useMemo(() => {
    const user = userQuery.data;
    if (!user) return undefined;
    return profilePostOwnerFromUser(user, t('profile.fallbackName'));
  }, [userQuery.data, t]);
}
