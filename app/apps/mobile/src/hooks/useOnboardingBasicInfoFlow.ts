// FR-AUTH-010 — basic-info step state + save/skip (keeps screen file under arch line cap).
import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useFeedSessionStore } from '../store/feedSessionStore';
import { getCompleteBasicInfoUseCase, markBasicInfoSkipped } from '../services/userComposition';
import { mapEditProfileSaveError } from '../lib/editProfileSaveErrors';
import { getProfileAddressPairIssue } from '../lib/profileAddressFieldGate';

export function useOnboardingBasicInfoFlow() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [displayName, setDisplayName] = useState(session?.displayName ?? '');
  const [city, setCity] = useState<{ id: string; name: string } | null>(null);
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const addressIssue = getProfileAddressPairIssue(street, streetNumber);
  const hasRequiredFields = displayName.trim().length > 0 && city !== null;
  const canSubmit = hasRequiredFields && addressIssue === null;

  const showAddressToast = () => {
    if (!addressIssue) return;
    useFeedSessionStore.getState().showEphemeralToast(
      mapEditProfileSaveError(addressIssue),
      'error',
      2800,
    );
  };

  const handleBack = () => {
    if (loading) return;
    router.replace('/(onboarding)/about-intro');
  };

  const handleContinue = async () => {
    if (!session) {
      useFeedSessionStore.getState().showEphemeralToast(
        'אין סשן פעיל. נסה להתחבר שוב.',
        'error',
        2500,
      );
      return;
    }
    if (!hasRequiredFields || !city) {
      Alert.alert('שגיאה', 'יש למלא שם ועיר');
      return;
    }
    if (!canSubmit) {
      showAddressToast();
      return;
    }
    setLoading(true);
    try {
      await getCompleteBasicInfoUseCase().execute({
        userId: session.userId,
        displayName,
        cityId: city.id,
        cityName: city.name,
        profileStreet: street,
        profileStreetNumber: streetNumber,
      });
      setOnboardingState('pending_avatar');
      router.replace('/(onboarding)/photo');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      const mapped = mapEditProfileSaveError(raw);
      useFeedSessionStore.getState().showEphemeralToast(mapped, 'error', 2800);
      Alert.alert('שמירה נכשלה', mapped);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!session) return;
    setLoading(true);
    try {
      await markBasicInfoSkipped(session.userId);
      useAuthStore.getState().setBasicInfoSkipped(true);
      router.replace('/(onboarding)/photo');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      const mapped = mapEditProfileSaveError(raw);
      useFeedSessionStore.getState().showEphemeralToast(mapped, 'error', 2800);
      Alert.alert('שמירה נכשלה', mapped);
    } finally {
      setLoading(false);
    }
  };

  return {
    displayName,
    setDisplayName,
    city,
    setCity,
    street,
    setStreet,
    streetNumber,
    setStreetNumber,
    loading,
    hasRequiredFields,
    canSubmit,
    handleBack,
    handleContinue,
    handleSkip,
  };
}
