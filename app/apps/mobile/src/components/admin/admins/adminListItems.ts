// app/apps/mobile/src/components/admin/admins/adminListItems.ts
// FR-ADMIN-022 — fold AdminPerson[] into flat list rows (active section, then
// an optional revoked section). Pure helper, kept out of the screen component.
import type { AdminPerson } from '@kc/domain';
import he from '../../../i18n/locales/he';

export type AdminListItem =
  | { kind: 'header'; title: string; count: number }
  | { kind: 'person'; person: AdminPerson };

export function buildAdminListItems(
  people: readonly AdminPerson[],
  includeRevoked: boolean,
): AdminListItem[] {
  const active = people.filter((p) => p.hasActiveGrant);
  const revoked = people.filter((p) => !p.hasActiveGrant);
  const out: AdminListItem[] = [];
  if (active.length > 0) {
    out.push({ kind: 'header', title: he.admin.admins.activeSectionTitle, count: active.length });
    for (const p of active) out.push({ kind: 'person', person: p });
  }
  if (includeRevoked && revoked.length > 0) {
    out.push({ kind: 'header', title: he.admin.admins.revokedSectionTitle, count: revoked.length });
    for (const p of revoked) out.push({ kind: 'person', person: p });
  }
  return out;
}
