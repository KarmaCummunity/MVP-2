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
        animation: 'slide_from_right',
        animationDuration: 280,
      }}
    >
      <Stack.Screen name="about-intro" />
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="tour" />
    </Stack>
  );
}
