// Async actions + modal state for `app/settings.tsx` (keeps screen under arch line cap).
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getSignOutUseCase } from '../services/authComposition';
import { getDeleteAccountUseCase, setOnboardingStateDirect } from '../services/userComposition';
import { useAuthStore } from '../store/authStore';
import { clearAllPersistedStores } from '../store/persistedStoresReset';
import { deactivateCurrentDevice } from '../lib/notifications/register';
import { container } from '../lib/container';

export function useSettingsAccountActions() {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const setOnboardingStateLocal = useAuthStore((s) => s.setOnboardingState);
  const signOutLocal = useAuthStore((s) => s.signOut);
  const [signingOut, setSigningOut] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteSuccessVisible, setDeleteSuccessVisible] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    await getDeleteAccountUseCase().execute();
    setDeleteModalVisible(false);
    setDeleteSuccessVisible(true);
    setTimeout(async () => {
      try {
        // Same TD-100 + TD-103 reasoning as handleSignOut, just on the
        // delete-account path. The account is already gone server-side at
        // this point; this is local cleanup only.
        try {
          await deactivateCurrentDevice({ deviceRepo: container.deviceRepo });
        } catch { /* ignore */ }
        await getSignOutUseCase().execute();
        await clearAllPersistedStores();
      } finally {
        signOutLocal();
        setDeleteSuccessVisible(false);
        router.replace('/(auth)');
      }
    }, 1500);
  }, [router, signOutLocal]);

  const performReset = useCallback(async () => {
    if (!session) return;
    setResettingOnboarding(true);
    try {
      await setOnboardingStateDirect(session.userId, 'pending_basic_info');
      setOnboardingStateLocal('pending_basic_info');
      useAuthStore.getState().setBasicInfoSkipped(false);
      router.replace('/(onboarding)/about-intro');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('general.unknownError');
      if (Platform.OS === 'web') {
        const w = globalThis as unknown as { alert: (m: string) => void };
        w.alert(t('settings.resetOnboardingFailed', { msg }));
      } else Alert.alert(t('settings.resetOnboardingFailed', { msg: '' }), msg);
    } finally {
      setResettingOnboarding(false);
    }
  }, [router, session, setOnboardingStateLocal]);

  const handleResetOnboarding = useCallback(() => {
    if (!session || resettingOnboarding) return;
    const msg = t('settings.resetOnboardingConfirmMsg');
    if (Platform.OS === 'web') {
      const w = globalThis as unknown as { confirm: (m: string) => boolean };
      if (w.confirm(msg)) void performReset();
      return;
    }
    Alert.alert(t('settings.resetOnboardingConfirmTitle'), msg, [
      { text: t('general.cancel'), style: 'cancel' },
      { text: t('settings.resetOnboardingBtn'), style: 'destructive', onPress: () => void performReset() },
    ]);
  }, [performReset, resettingOnboarding, session]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // TD-100 (folded under P2.14 because it sits inside this sign-out path):
      // deactivate the Expo push token before clearing the session, otherwise
      // the device row stays is_active=true against the signed-out user and
      // the next user on this device receives pushes meant for the previous
      // one. Best-effort — never block sign-out if it fails.
      try {
        await deactivateCurrentDevice({ deviceRepo: container.deviceRepo });
      } catch {
        /* ignore — sign-out must always succeed locally */
      }

      await getSignOutUseCase().execute();

      // TD-103: persisted Zustand stores survive Supabase sign-out. Clear
      // before navigating away so the next sign-in starts clean.
      await clearAllPersistedStores();

      signOutLocal();
      router.replace('/(auth)');
    } catch {
      Alert.alert(t('general.error'), t('settings.signOutFailed'));
    } finally {
      setSigningOut(false);
    }
  }, [router, signOutLocal, signingOut, t]);

  return {
    signingOut,
    resettingOnboarding,
    deleteModalVisible,
    setDeleteModalVisible,
    deleteSuccessVisible,
    handleDeleteConfirm,
    handleResetOnboarding,
    handleSignOut,
  };
}
