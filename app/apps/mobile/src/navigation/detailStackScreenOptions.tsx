// Shared native-stack options for modal/detail routes (see root `app/_layout.tsx`).
import { colors } from '@kc/ui';
import { nativeStackHeaderLeftIconOnly } from './nativeHeaderIconOnly';

export const detailStackScreenOptions = {
  headerShown: true,
  ...nativeStackHeaderLeftIconOnly,
  headerBackVisible: false,
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleAlign: 'center' as const,
};
