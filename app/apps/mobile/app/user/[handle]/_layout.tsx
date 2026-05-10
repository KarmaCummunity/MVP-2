// app/apps/mobile/app/user/[handle]/_layout.tsx
// Nested Stack owns the header for /user/[handle]/* routes (parent suppresses
// its header for this group to avoid the doubled-header bug). Mirrors the
// detailHeader styling from the parent _layout so the chrome stays consistent.

import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@kc/ui';
import { BackButton } from '../../../src/components/BackButton';

export default function UserHandleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: BackButton,
        headerBackVisible: false,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleAlign: 'center',
      }}
    />
  );
}
