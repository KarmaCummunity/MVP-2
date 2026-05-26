// app/apps/mobile/src/components/admin/AdminGate.tsx
import { Redirect } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { useAdminRoles } from '../../hooks/useAdminRoles';

export interface AdminGateProps {
  children: ReactNode;
  anyOf?: readonly string[];
}

export function AdminGate({ children, anyOf }: AdminGateProps): ReactElement {
  const roles = useAdminRoles();
  if (roles.length === 0) {
    return <Redirect href="/(tabs)" />;
  }
  if (anyOf && !roles.some((r) => anyOf.includes(r))) {
    // Cast: expo-router generates the (admin) typed route once route files
    // exist (Task 18). This gate may render before that during a cold start.
    return <Redirect href={'/(admin)' as never} />;
  }
  return <>{children}</>;
}
