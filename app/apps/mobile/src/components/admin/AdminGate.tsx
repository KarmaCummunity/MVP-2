// app/apps/mobile/src/components/admin/AdminGate.tsx
import { Redirect } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAdminRoles } from '../../hooks/useAdminRoles';

export interface AdminGateProps {
  children: ReactNode;
  anyOf?: readonly string[];
}

export function AdminGate({ children, anyOf }: AdminGateProps): ReactElement {
  const { roles, isLoading } = useAdminRoles();
  // Wait for the role query before deciding — without this, a cold-start
  // render sees `roles.length === 0` and redirects to /(tabs), creating a
  // tap → flash-of-deny → tap loop for legitimate admins on native (the
  // native stack can't recover from a Redirect mid-mount the way web URL
  // routing does).
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (roles.length === 0) {
    return <Redirect href="/(tabs)" />;
  }
  if (anyOf && !roles.some((r) => anyOf.includes(r))) {
    return <Redirect href="/(admin)" />;
  }
  return <>{children}</>;
}
