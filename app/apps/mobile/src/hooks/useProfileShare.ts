// FR-PROFILE-008 — share-sheet orchestration for the My Profile "Share Profile"
// action button. Mirrors `usePostShare` (FR-POST-023).
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveWebBaseUrl } from '../lib/buildPostShareUrl';
import { shareProfile, type ShareProfileOutcome } from '../lib/shareProfile';
import { useFeedSessionStore } from '../store/feedSessionStore';

type ToastSpec = Readonly<{ key: string; tone: 'success' | 'error'; ms: number }>;

// Maps a (never-throwing) share outcome to the toast to surface, or null = silent.
const OUTCOME_TOAST: Partial<Record<ShareProfileOutcome['kind'], ToastSpec>> = {
  copied: { key: 'profile.shareCopiedToast', tone: 'success', ms: 1800 },
  failed: { key: 'profile.shareFailedToast', tone: 'error', ms: 2200 },
};

export function useProfileShare(handle: string | null | undefined, displayName: string) {
  const { t } = useTranslation();
  const showToast = useFeedSessionStore((s) => s.showEphemeralToast);
  const [busy, setBusy] = useState(false);
  const cleanHandle = handle?.trim() ?? '';
  const canShare = cleanHandle.length > 0;

  const share = useCallback(async () => {
    if (busy || cleanHandle.length === 0) return;
    setBusy(true);
    try {
      const outcome = await shareProfile({
        handle: cleanHandle,
        title: displayName,
        message: t('profile.shareMessage', { name: displayName }),
        webBaseUrl: resolveWebBaseUrl({ EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL }),
      });
      const toast = OUTCOME_TOAST[outcome.kind];
      if (toast) showToast(t(toast.key), toast.tone, toast.ms);
    } catch (err) {
      console.warn('[useProfileShare] share failed', err);
      showToast(t('profile.shareFailedToast'), 'error', 2200);
    } finally {
      setBusy(false);
    }
  }, [busy, cleanHandle, displayName, showToast, t]);

  return { canShare, share, busy };
}
