export interface AdminUserSearchResult {
  readonly userId: string;
  readonly displayName: string | null;
  readonly shareHandle: string | null;
  readonly accountStatus: string;
  readonly cityName: string | null;
  readonly createdAt: Date;
  readonly lastSeenAt: Date | null;
}

export interface AdminPostSearchResult {
  readonly postId: string;
  readonly title: string | null;
  readonly type: string;
  readonly status: string;
  readonly visibility: string;
  readonly ownerId: string;
  readonly ownerDisplayName: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AdminAuditRow {
  readonly eventId: string;
  readonly actorId: string | null;
  readonly actorDisplayName: string | null;
  readonly action: string;
  readonly targetType: string | null;
  readonly targetId: string | null;
  readonly targetDisplayName: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
}

export interface AdminSearchPage<T> {
  readonly rows: readonly T[];
  readonly totalCount: number;
}

export class AdminContentError extends Error {
  readonly code: 'forbidden' | 'invalid_status' | 'invalid_input' | 'unknown';

  constructor(code: AdminContentError['code'], message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AdminContentError';
  }
}

export function isAdminContentError(err: unknown): err is AdminContentError {
  return err instanceof AdminContentError;
}
