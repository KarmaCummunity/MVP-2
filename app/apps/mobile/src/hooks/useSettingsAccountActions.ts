// Async actions + modal state for `app/settings.tsx` (keeps screen under arch line cap).
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getSignOutUseCase } from '../services/authComposition';
import { getDeleteAccountUseCase, setOnboardingStateDirect } from '../services/userComposition';
import { useAuthStore } from '../store/authStore';

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
        await getSignOutUseCase().execute();
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
      await getSignOutUseCase().execute();
      signOutLocal();
      router.replace('/(auth)');
    } catch {
      Alert.alert(t('general.error'), t('settings.signOutFailed'));
    } finally {
      setSigningOut(false);
    }
  }, [router, signOutLocal, signingOut]);

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
