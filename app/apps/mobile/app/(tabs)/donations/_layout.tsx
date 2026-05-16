// Donations tab — Stack within the tab so Hub / Money / Time / Category share back-nav.
// Mapped to: FR-DONATE-001..009 / D-16.
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import { nativeStackHeaderLeftIconOnly } from '../../../src/navigation/nativeHeaderIconOnly';

const detailHeader = {
  headerShown: true,
  ...nativeStackHeaderLeftIconOnly,
  headerBackVisible: false,
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.surface },
} as const;

export default function DonationsLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="money" options={{ ...detailHeader, headerTitle: t('donations.moneyScreen.title') }} />
      <Stack.Screen name="time" options={{ ...detailHeader, headerTitle: t('donations.timeScreen.title') }} />
      <Stack.Screen name="category/[slug]" options={{ ...detailHeader, headerTitle: '' }} />
    </Stack>
  );
}
