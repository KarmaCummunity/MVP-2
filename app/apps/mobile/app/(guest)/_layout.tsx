import { Stack } from 'expo-router';
import { colors } from '@kc/ui';

export default function GuestGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
