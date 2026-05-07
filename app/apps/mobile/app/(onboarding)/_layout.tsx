import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kc/ui';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="tour" />
    </Stack>
  );
}
