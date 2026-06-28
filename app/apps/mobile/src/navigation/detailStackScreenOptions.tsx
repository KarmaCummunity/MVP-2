// Shared native-stack options for modal/detail routes (see root `app/_layout.tsx`).
import { useTheme } from '@kc/ui';
import { nativeStackHeaderLeftIconOnly } from './nativeHeaderIconOnly';

export function useDetailStackScreenOptions() {
  const { colors } = useTheme();
  return {
    headerShown: true,
    ...nativeStackHeaderLeftIconOnly(colors.primary),
    headerBackVisible: false,
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.surface },
    headerTitleAlign: 'center' as const,
  } as const;
}
