// V2-ADMIN-ORG-7 — port for admin org-applications operations.
import type { OrgApplicationPage, OrgApplicationStatus } from '@kc/domain';

export interface OrgApplicationListFilters {
  readonly status?: OrgApplicationStatus;
  readonly limit?: number;
  readonly offset?: number;
}

export interface IOrgApplicationsRepository {
  list(filters: OrgApplicationListFilters): Promise<OrgApplicationPage>;
  approve(applicationId: string, note?: string | null): Promise<void>;
  reject(applicationId: string, note?: string | null): Promise<void>;
}
