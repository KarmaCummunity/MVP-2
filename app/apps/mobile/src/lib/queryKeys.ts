/** Shared React Query keys — avoids duplicate caches for the same user profile. */
export const userProfileKeys = {
  byId: (userId: string) => ['user-profile', userId] as const,
};
