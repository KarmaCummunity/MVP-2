import { Stack } from 'expo-router';
import { useTheme } from '@kc/ui';

export default function GuestGroupLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
