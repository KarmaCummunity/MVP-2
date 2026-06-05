// V2-ADMIN-CRM-8 — Supabase adapter for `crm_contacts`.
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CrmContactListFilters,
  CrmContactUpsertInput,
  ICrmContactsRepository,
} from '@kc/application';
import {
  CrmContactError,
  type CrmContact,
  type CrmContactPage,
  parseCrmContactStatus,
} from '@kc/domain';

interface ContactRow {
  contact_id:        string;
  name:              string;
  organization:      string | null;
  email:             string | null;
  phone:             string | null;
  role_title:        string | null;
  notes:             string | null;
  tags:              string[] | null;
  status:            string;
  last_contacted_at: string | null;
  created_at:        string;
  updated_at:        string;
  total_count:       number | string;
}

function toError(err: { message?: string; code?: string } | null): CrmContactError {
  const msg = err?.message ?? '';
  if (msg === 'invalid_name')      return new CrmContactError('invalid_name');
  if (msg === 'invalid_status')    return new CrmContactError('invalid_status');
  if (msg === 'contact_not_found' || err?.code === 'P0002') {
    return new CrmContactError('contact_not_found');
  }
  if (err?.code === '42501')       return new CrmContactError('forbidden');
  return new CrmContactError('unknown', msg);
}

function mapRow(row: ContactRow): CrmContact | null {
  const status = parseCrmContactStatus(row.status);
  if (status === null) return null;
  return {
    contactId:       row.contact_id,
    name:            row.name,
    organization:    row.organization,
    email:           row.email,
    phone:           row.phone,
    roleTitle:       row.role_title,
    notes:           row.notes,
    tags:            Array.isArray(row.tags) ? row.tags : [],
    status,
    lastContactedAt: row.last_contacted_at === null ? null : new Date(row.last_contacted_at),
    createdAt:       new Date(row.created_at),
    updatedAt:       new Date(row.updated_at),
  };
}

function totalOf(rows: readonly ContactRow[]): number {
  if (rows.length === 0) return 0;
  const first = rows[0]!.total_count;
  return typeof first === 'number' ? first : Number.parseInt(first, 10);
}

export class SupabaseCrmContactsRepository implements ICrmContactsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(filters: CrmContactListFilters): Promise<CrmContactPage> {
    const { data, error } = await this.client.rpc('crm_contact_list', {
      p_status: filters.status ?? null,
      p_query:  filters.query  ?? null,
      p_tag:    filters.tag    ?? null,
      p_limit:  filters.limit  ?? 50,
      p_offset: filters.offset ?? 0,
    });
    if (error) throw toError(error);
    const raw = Array.isArray(data) ? (data as ContactRow[]) : [];
    const rows: CrmContact[] = [];
    for (const r of raw) {
      const m = mapRow(r);
      if (m !== null) rows.push(m);
    }
    return { rows, totalCount: totalOf(raw) };
  }

  async upsert(input: CrmContactUpsertInput): Promise<string> {
    const { data, error } = await this.client.rpc('crm_contact_upsert', {
      p_contact_id:  input.contactId  ?? null,
      p_name:        input.name        ?? null,
      p_organization: input.organization ?? null,
      p_email:       input.email       ?? null,
      p_phone:       input.phone       ?? null,
      p_role_title:  input.roleTitle   ?? null,
      p_notes:       input.notes       ?? null,
      p_tags:        input.tags ? [...input.tags] : null,
      p_status:      input.status      ?? null,
    });
    if (error) throw toError(error);
    if (typeof data !== 'string') {
      throw new CrmContactError('unknown', 'crm_contact_upsert did not return an id');
    }
    return data;
  }

  async delete(contactId: string): Promise<void> {
    const { error } = await this.client.rpc('crm_contact_delete', { p_contact_id: contactId });
    if (error) throw toError(error);
  }

  async markContacted(contactId: string): Promise<void> {
    const { error } = await this.client.rpc('crm_contact_mark_contacted', { p_contact_id: contactId });
    if (error) throw toError(error);
  }
}
