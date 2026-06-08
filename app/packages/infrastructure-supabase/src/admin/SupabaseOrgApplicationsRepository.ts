// V2-ADMIN-ORG-7 — Supabase adapter for `org_applications`.
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IOrgApplicationsRepository,
  OrgApplicationListFilters,
} from '@kc/application';
import {
  OrgApplicationError,
  type OrgApplication,
  type OrgApplicationPage,
  parseOrgApplicationStatus,
} from '@kc/domain';

interface OrgApplicationRow {
  application_id: string;
  applicant_user_id: string;
  applicant_name: string | null;
  org_name: string;
  org_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_name: string | null;
  review_note: string | null;
  total_count: number | string;
}

function toError(err: { message?: string; code?: string } | null): OrgApplicationError {
  const msg = err?.message ?? '';
  if (msg === 'invalid_status') return new OrgApplicationError('invalid_status');
  if (msg === 'application_not_found' || err?.code === 'P0002') {
    return new OrgApplicationError('application_not_found');
  }
  if (msg === 'application_already_decided') return new OrgApplicationError('application_already_decided');
  if (err?.code === '42501') return new OrgApplicationError('forbidden');
  return new OrgApplicationError('unknown', msg);
}

function mapRow(row: OrgApplicationRow): OrgApplication | null {
  const status = parseOrgApplicationStatus(row.status);
  if (status === null) return null;
  return {
    applicationId:    row.application_id,
    applicantUserId:  row.applicant_user_id,
    applicantName:    row.applicant_name,
    orgName:          row.org_name,
    orgDescription:   row.org_description,
    contactEmail:     row.contact_email,
    contactPhone:     row.contact_phone,
    websiteUrl:       row.website_url,
    status,
    createdAt:        new Date(row.created_at),
    reviewedAt:       row.reviewed_at === null ? null : new Date(row.reviewed_at),
    reviewedBy:       row.reviewed_by,
    reviewerName:     row.reviewer_name,
    reviewNote:       row.review_note,
  };
}

function totalOf(rows: readonly OrgApplicationRow[]): number {
  if (rows.length === 0) return 0;
  const first = rows[0]!.total_count;
  return typeof first === 'number' ? first : Number.parseInt(first, 10);
}

export class SupabaseOrgApplicationsRepository implements IOrgApplicationsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(filters: OrgApplicationListFilters): Promise<OrgApplicationPage> {
    const { data, error } = await this.client.rpc('admin_org_application_list', {
      p_status: filters.status ?? null,
      p_limit:  filters.limit  ?? 50,
      p_offset: filters.offset ?? 0,
    });
    if (error) throw toError(error);
    const raw = Array.isArray(data) ? (data as OrgApplicationRow[]) : [];
    const rows: OrgApplication[] = [];
    for (const r of raw) {
      const m = mapRow(r);
      if (m !== null) rows.push(m);
    }
    return { rows, totalCount: totalOf(raw) };
  }

  async approve(applicationId: string, note?: string | null): Promise<void> {
    const { error } = await this.client.rpc('admin_org_application_approve', {
      p_application_id: applicationId,
      p_note: note ?? null,
    });
    if (error) throw toError(error);
  }

  async reject(applicationId: string, note?: string | null): Promise<void> {
    const { error } = await this.client.rpc('admin_org_application_reject', {
      p_application_id: applicationId,
      p_note: note ?? null,
    });
    if (error) throw toError(error);
  }
}
