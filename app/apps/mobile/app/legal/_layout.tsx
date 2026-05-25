import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function LegalLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackTitle: '' }}>
      <Stack.Screen name="terms" options={{ title: t('legal.termsTitle') }} />
      <Stack.Screen name="privacy" options={{ title: t('legal.privacyTitle') }} />
    </Stack>
  );
}
