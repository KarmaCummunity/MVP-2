// FR-AUTH-011 — photo step state: pick/remove/finalize (keeps screen file under arch line cap).
import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import {
  getCompleteOnboardingUseCase,
  getSetAvatarUseCase,
} from '../services/userComposition';
import {
  pickAvatarImage,
  resizeAndUploadAvatar,
  type AvatarSource,
} from '../services/avatarUpload';

export function useOnboardingPhotoFlow() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const onboardingState = useAuthStore((s) => s.onboardingState);
  const setSession = useAuthStore((s) => s.setSession);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [uploading, setUploading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const avatarUrl = session?.avatarUrl ?? null;
  const hasAvatar = !!avatarUrl;
  const busy = uploading || finalizing;

  const pick = async (source: AvatarSource) => {
    if (!session) return;
    setUploading(true);
    try {
      const picked = await pickAvatarImage(source);
      if (!picked) return;
      const url = await resizeAndUploadAvatar(picked, session.userId);
      await getSetAvatarUseCase().execute({ userId: session.userId, avatarUrl: url });
      setSession({ ...session, avatarUrl: url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('העלאת התמונה נכשלה', `אפשר לדלג ולהוסיף תמונה מאוחר יותר.\n${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!session) return;
    setUploading(true);
    try {
      await getSetAvatarUseCase().execute({ userId: session.userId, avatarUrl: null });
      setSession({ ...session, avatarUrl: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('הסרת התמונה נכשלה', msg);
    } finally {
      setUploading(false);
    }
  };

  const finalize = async () => {
    if (!session) return;
    setFinalizing(true);
    try {
      if (onboardingState === 'pending_avatar') {
        await getCompleteOnboardingUseCase().execute({ userId: session.userId });
        setOnboardingState('completed');
      }
      router.replace('/(onboarding)/tour');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', msg);
    } finally {
      setFinalizing(false);
    }
  };

  const goBack = () => {
    if (busy) return;
    router.replace('/(onboarding)/basic-info');
  };

  return {
    session,
    avatarUrl,
    hasAvatar,
    uploading,
    finalizing,
    busy,
    pick,
    remove,
    finalize,
    goBack,
  };
}
