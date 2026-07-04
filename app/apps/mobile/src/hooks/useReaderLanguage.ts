// FR-TRANSLATE-003 — the reader's effective output language (BCP-47). Reads the
// persisted users.preferred_language and folds in device locale (he fallback).
import { useQuery } from '@tanstack/react-query';
import { resolveReaderLanguage } from '../i18n/deviceLanguage';
import { getUserRepo } from '../services/userComposition';
import { useAuthStore } from '../store/authStore';

export function useReaderLanguage(): string {
  const userId = useAuthStore((s) => s.session?.userId);
  const { data } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
  return resolveReaderLanguage(data?.preferredLanguage ?? null);
}
