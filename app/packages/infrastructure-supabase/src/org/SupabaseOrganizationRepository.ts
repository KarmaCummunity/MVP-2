// FR-ORG-002/004 — Supabase adapter for the organization read model.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IOrganizationRepository } from '@kc/application';
import {
  OrganizationError,
  parseOrganizationStatus,
  type Organization,
} from '@kc/domain';

interface OrganizationRow {
  id: string;
  slug: string;
  display_name: string;
  legal_name: string | null;
  status: string;
  is_default: boolean;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  currency: string | null;
  locale: string | null;
}

function toError(err: { message?: string; code?: string } | null): OrganizationError {
  if (err?.code === '42501') return new OrganizationError('forbidden');
  return new OrganizationError('unknown', err?.message ?? '');
}

function mapRow(row: OrganizationRow): Organization | null {
  const status = parseOrganizationStatus(row.status);
  if (status === null) return null;
  return {
    id:           row.id,
    slug:         row.slug,
    displayName:  row.display_name,
    legalName:    row.legal_name,
    status,
    isDefault:    row.is_default === true,
    logoUrl:      row.logo_url,
    primaryColor: row.primary_color,
    accentColor:  row.accent_color,
    currency:     row.currency ?? 'ILS',
    locale:       row.locale ?? 'he',
  };
}

export class SupabaseOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<readonly Organization[]> {
    const { data, error } = await this.client.rpc('get_my_organizations');
    if (error) throw toError(error);
    const raw = Array.isArray(data) ? (data as OrganizationRow[]) : [];
    const rows: Organization[] = [];
    for (const r of raw) {
      const m = mapRow(r);
      if (m !== null) rows.push(m);
    }
    return rows;
  }
}
