// FR-PROFILE-008 — share-sheet orchestration for the My Profile "Share Profile"
// action button. Mirrors `usePostShare` (FR-POST-023).
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveWebBaseUrl } from '../lib/buildPostShareUrl';
import { shareProfile } from '../lib/shareProfile';
import { useFeedSessionStore } from '../store/feedSessionStore';

export function useProfileShare(handle: string | null | undefined, displayName: string) {
  const { t } = useTranslation();
  const showToast = useFeedSessionStore((s) => s.showEphemeralToast);
  const [busy, setBusy] = useState(false);
  const canShare = Boolean(handle && handle.trim());

  const share = useCallback(async () => {
    if (busy || !handle || !handle.trim()) return;
    setBusy(true);
    try {
      const webBaseUrl = resolveWebBaseUrl({
        EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL,
      });
      const outcome = await shareProfile({
        handle,
        title: displayName,
        message: t('profile.shareMessage', { name: displayName }),
        webBaseUrl,
      });
      if (outcome.kind === 'copied') {
        showToast(t('profile.shareCopiedToast'), 'success', 1800);
      } else if (outcome.kind === 'failed') {
        showToast(t('profile.shareFailedToast'), 'error', 2200);
      }
    } catch (err) {
      console.warn('[useProfileShare] share failed', err);
      showToast(t('profile.shareFailedToast'), 'error', 2200);
    } finally {
      setBusy(false);
    }
  }, [busy, handle, displayName, showToast, t]);

  return { canShare, share, busy };
}
