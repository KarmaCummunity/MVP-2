// Donations tab — Stack within the tab so Hub / Money / Time / Category share back-nav.
// Mapped to: FR-DONATE-001..009 / D-16.
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kc/ui';
import { BackButton } from '../../../src/components/BackButton';

const detailHeader = {
  headerShown: true,
  headerLeft: BackButton,
  headerBackVisible: false,
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.surface },
} as const;

export default function DonationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="money" options={{ ...detailHeader, headerTitle: 'תרומה כספית' }} />
      <Stack.Screen name="time" options={{ ...detailHeader, headerTitle: 'תרומת זמן' }} />
      <Stack.Screen name="category/[slug]" options={{ ...detailHeader, headerTitle: '' }} />
    </Stack>
  );
}
