// Shared native-stack options for modal/detail routes (see root `app/_layout.tsx`).
import { colors } from '@kc/ui';
import { BackButton } from '../components/BackButton';

export const detailStackScreenOptions = {
  headerShown: true,
  headerLeft: BackButton,
  headerBackVisible: false,
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleAlign: 'center' as const,
};
