// app/apps/mobile/src/hooks/useAdminPortalReportsFlag.ts
// EXPO_PUBLIC_ADMIN_PORTAL_REPORTS — when "true", chat-flow ReportReceivedBubble
// renders read-only with a deep-link to the portal case.
export function useAdminPortalReportsFlag(): boolean {
  return process.env['EXPO_PUBLIC_ADMIN_PORTAL_REPORTS'] === 'true';
}
