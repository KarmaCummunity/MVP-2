// Stack layout for My Profile. `index` / `closed` keep the profile chrome;
// `saved` / `hidden` / `removed` are pushed list screens with a standard back header.
// Mapped to: FR-PROFILE-001 AC4, FR-PROFILE-016.
import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import { nativeStackHeaderLeftIconOnly } from '../../../src/navigation/nativeHeaderIconOnly';

const listScreenHeader = {
  headerShown: true,
  ...nativeStackHeaderLeftIconOnly,
  headerBackVisible: false,
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleAlign: 'center' as const,
} as const;

export default function ProfileTabLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="closed" />
      <Stack.Screen
        name="saved"
        options={{
          ...listScreenHeader,
          headerTitle: t('profile.myProfileMenuSavedPosts'),
        }}
      />
      <Stack.Screen
        name="hidden"
        options={{
          ...listScreenHeader,
          headerTitle: t('profile.myProfileMenuHiddenPosts'),
        }}
      />
      <Stack.Screen
        name="removed"
        options={{
          ...listScreenHeader,
          headerTitle: t('profile.myProfileMenuRemovedPosts'),
        }}
      />
    </Stack>
  );
}
