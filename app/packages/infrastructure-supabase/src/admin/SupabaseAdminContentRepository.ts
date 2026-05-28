import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminAuditSearchFilters,
  AdminPostSearchFilters,
  AdminUserSearchFilters,
  IAdminContentRepository,
} from '@kc/application';
import {
  AdminContentError,
  type AdminAuditRow,
  type AdminPostSearchResult,
  type AdminSearchPage,
  type AdminUserSearchResult,
} from '@kc/domain';

interface UserRow {
  user_id: string;
  display_name: string | null;
  share_handle: string | null;
  account_status: string;
  city_name: string | null;
  created_at: string;
  last_seen_at: string | null;
  total_count: number | string;
}

interface PostRow {
  post_id: string;
  title: string | null;
  type: string;
  status: string;
  visibility: string;
  owner_id: string;
  owner_display_name: string | null;
  created_at: string;
  updated_at: string;
  total_count: number | string;
}

interface AuditRow {
  event_id: string;
  actor_id: string | null;
  actor_display_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_display_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  total_count: number | string;
}

function toError(err: { message?: string; code?: string } | null): AdminContentError {
  const msg = err?.message ?? '';
  if (msg === 'invalid_status') return new AdminContentError('invalid_status');
  if (msg === 'forbidden' || err?.code === '42501') return new AdminContentError('forbidden');
  if (msg === 'invalid_input') return new AdminContentError('invalid_input');
  return new AdminContentError('unknown', msg);
}

function totalOf(rows: readonly { total_count: number | string }[]): number {
  if (rows.length === 0) return 0;
  const first = rows[0]!.total_count;
  return typeof first === 'number' ? first : Number.parseInt(first, 10);
}

function mapUser(row: UserRow): AdminUserSearchResult {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    shareHandle: row.share_handle,
    accountStatus: row.account_status,
    cityName: row.city_name,
    createdAt: new Date(row.created_at),
    lastSeenAt: row.last_seen_at === null ? null : new Date(row.last_seen_at),
  };
}

function mapPost(row: PostRow): AdminPostSearchResult {
  return {
    postId: row.post_id,
    title: row.title,
    type: row.type,
    status: row.status,
    visibility: row.visibility,
    ownerId: row.owner_id,
    ownerDisplayName: row.owner_display_name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapAudit(row: AuditRow): AdminAuditRow {
  return {
    eventId: row.event_id,
    actorId: row.actor_id,
    actorDisplayName: row.actor_display_name,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    targetDisplayName: row.target_display_name,
    metadata: row.metadata ?? {},
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseAdminContentRepository implements IAdminContentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async searchUsers(filters: AdminUserSearchFilters): Promise<AdminSearchPage<AdminUserSearchResult>> {
    const { data, error } = await this.client.rpc('admin_search_users', {
      p_query:  filters.query  ?? null,
      p_status: filters.status ?? null,
      p_limit:  filters.limit  ?? 50,
      p_offset: filters.offset ?? 0,
    });
    if (error) throw toError(error);
    const rows = Array.isArray(data) ? (data as UserRow[]) : [];
    return { rows: rows.map(mapUser), totalCount: totalOf(rows) };
  }

  async searchPosts(filters: AdminPostSearchFilters): Promise<AdminSearchPage<AdminPostSearchResult>> {
    const { data, error } = await this.client.rpc('admin_search_posts', {
      p_query:  filters.query  ?? null,
      p_status: filters.status ?? null,
      p_limit:  filters.limit  ?? 50,
      p_offset: filters.offset ?? 0,
    });
    if (error) throw toError(error);
    const rows = Array.isArray(data) ? (data as PostRow[]) : [];
    return { rows: rows.map(mapPost), totalCount: totalOf(rows) };
  }

  async searchAudit(filters: AdminAuditSearchFilters): Promise<AdminSearchPage<AdminAuditRow>> {
    const { data, error } = await this.client.rpc('admin_audit_search', {
      p_target_user_id: filters.targetUserId ?? null,
      p_actor_id:       filters.actorId      ?? null,
      p_action:         filters.action       ?? null,
      p_limit:          filters.limit        ?? 100,
      p_offset:         filters.offset       ?? 0,
    });
    if (error) throw toError(error);
    const rows = Array.isArray(data) ? (data as AuditRow[]) : [];
    return { rows: rows.map(mapAudit), totalCount: totalOf(rows) };
  }
}
