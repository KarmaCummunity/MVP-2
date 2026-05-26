// app/apps/mobile/src/components/admin/AdminGate.tsx
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { useAdminRoles } from '../../hooks/useAdminRoles';

export interface AdminGateProps {
  children: ReactNode;
  anyOf?: readonly string[];
}

export function AdminGate({ children, anyOf }: AdminGateProps): JSX.Element {
  const roles = useAdminRoles();
  if (roles.length === 0) {
    return <Redirect href="/(tabs)" />;
  }
  if (anyOf && !roles.some((r) => anyOf.includes(r))) {
    return <Redirect href="/(admin)" />;
  }
  return <>{children}</>;
}
